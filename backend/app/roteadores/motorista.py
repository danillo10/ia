from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from ..core.deps import obter_usuario_atual
from ..core.db import obter_sessao
from ..modelos.corrida import Corrida
from ..modelos.usuario import Usuario
from ..modelos.motorista_status import MotoristaStatus
from ..modelos.historico_status_motorista import HistoricoStatusMotorista
from ..servicos.roteamento import haversine_km

roteador = APIRouter(prefix="", tags=["Motociclista"])  # mistura endpoints


class MotoristaAtivo(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str] = None
    placa: Optional[str] = None
    online: bool
    lat: float
    lon: float
    ultima_localizacao_em: Optional[str] = None
    distancia_km: Optional[float] = None

@roteador.put("/motoristas/status-online")
async def status_online(payload: dict, sessao: AsyncSession = Depends(obter_sessao)):
    """
    Atualiza status online/offline do motorista e registra no histórico
    SEM AUTENTICAÇÃO - Para desenvolvimento
    """
    print(f"📥 Payload recebido: {payload}")
    online = bool(payload.get("online", True))
    motorista_id = payload.get("motorista_id", 1)  # ID padrão para testes
    
    print(f"🟢 Motorista #{motorista_id} alterou status para: {'ONLINE' if online else 'OFFLINE'} (valor parsed: {online})")
    
    # Busca ou cria registro de status (sem validar se é motorista)
    res = await sessao.execute(sa.select(MotoristaStatus).where(MotoristaStatus.motorista_id == motorista_id))
    status = res.scalars().first()
    
    if not status:
        # Cria novo registro
        status = MotoristaStatus(
            motorista_id=motorista_id,
            online=online,
            ultima_vez_online=datetime.utcnow()
        )
        sessao.add(status)
        print(f"✨ Novo registro de status criado para motorista #{motorista_id}")
    else:
        # Atualiza registro existente
        status.online = online
        status.ultima_vez_online = datetime.utcnow()
        print(f"🔄 Status atualizado para motorista #{motorista_id}")
    
    # Registra no histórico
    historico = HistoricoStatusMotorista(
        motorista_id=motorista_id,
        online=online,
        alterado_em=datetime.utcnow()
    )
    sessao.add(historico)
    
    await sessao.commit()
    
    print(f"✅ Status e histórico salvos - Motorista {'ONLINE' if online else 'OFFLINE'}")
    return {
        "ok": True,
        "online": online, 
        "message": f"Motorista {'online' if online else 'offline'}"
    }

@roteador.post("/motoristas/localizacao")
async def atualizar_localizacao(payload: dict, sessao: AsyncSession = Depends(obter_sessao)):
    """
    Atualiza localização do motorista
    """
    lat = payload.get("lat")
    lon = payload.get("lon")
    motorista_id = payload.get("motorista_id", 1)
    
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude e longitude são obrigatórias")
    
    print(f"📍 Atualizando localização do motorista #{motorista_id}: {lat}, {lon}")
    
    # Busca status do motorista
    res = await sessao.execute(sa.select(MotoristaStatus).where(MotoristaStatus.motorista_id == motorista_id))
    status = res.scalars().first()
    
    if not status:
        # Se não existe, cria
        status = MotoristaStatus(
            motorista_id=motorista_id,
            online=True,
            lat=lat,
            lon=lon,
            ultima_localizacao_em=datetime.utcnow()
        )
        sessao.add(status)
        print(f"✨ Novo registro de localização criado para motorista #{motorista_id}")
    else:
        # Atualiza localização
        status.lat = lat
        status.lon = lon
        status.ultima_localizacao_em = datetime.utcnow()
        print(f"✅ Localização atualizada para motorista #{motorista_id}")
    
    await sessao.commit()
    
    return {"ok": True, "lat": lat, "lon": lon}

@roteador.post("/corridas/{corrida_id}/aceitar")
async def aceitar_corrida(corrida_id: int, payload: dict, sessao: AsyncSession = Depends(obter_sessao)):
    # Por enquanto sem autenticação
    motorista_id = payload.get("motorista_id", 1)  # ID padrão 1 se não informado
    
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    if c.motorista_id:
        raise HTTPException(status_code=409, detail="Corrida já aceita por outro motociclista")
    c.motorista_id = motorista_id
    c.estado = 'aceita'
    await sessao.commit()
    print(f"✅ Corrida #{corrida_id} aceita pelo motorista #{motorista_id}")
    return {"ok": True}

@roteador.post("/corridas/{corrida_id}/iniciar")
async def iniciar_corrida(corrida_id: int, sessao: AsyncSession = Depends(obter_sessao)):
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    c.estado = 'em_andamento'
    await sessao.commit()
    print(f"🚀 Corrida #{corrida_id} iniciada")
    return {"ok": True}
    await sessao.commit()
    return {"ok": True}

@roteador.post("/corridas/{corrida_id}/finalizar")
async def finalizar_corrida(corrida_id: int, sessao: AsyncSession = Depends(obter_sessao)):
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    c.estado = 'finalizada'
    c.preco_final = c.preco_estimado
    await sessao.commit()
    print(f"🏁 Corrida #{corrida_id} finalizada - Preço: R$ {c.preco_final}")
    return {"ok": True, "preco_final": c.preco_final}


@roteador.get("/motoristas/ativos", response_model=List[MotoristaAtivo])
async def listar_motoristas_ativos(
    lat: Optional[float] = Query(None, description="Latitude do passageiro"),
    lon: Optional[float] = Query(None, description="Longitude do passageiro"),
    raio_km: float = Query(10.0, description="Raio de busca em km"),
    sessao: AsyncSession = Depends(obter_sessao)
):
    """
    Lista motoristas ativos (online) na plataforma
    Se lat/lon forem fornecidos, retorna apenas motoristas próximos dentro do raio
    """
    print(f"🔍 Buscando motoristas ativos (raio: {raio_km}km)")
    
    # Busca motoristas online com localização
    query = sa.select(MotoristaStatus, Usuario).join(
        Usuario, MotoristaStatus.motorista_id == Usuario.id
    ).where(
        MotoristaStatus.online == True,
        MotoristaStatus.lat.isnot(None),
        MotoristaStatus.lon.isnot(None)
    )
    
    res = await sessao.execute(query)
    resultados = res.all()
    
    motoristas_ativos = []
    for status, usuario in resultados:
        # Se lat/lon fornecidos, calcula distância
        if lat is not None and lon is not None:
            distancia = haversine_km(lat, lon, status.lat, status.lon)
            if distancia > raio_km:
                continue  # Pula motoristas fora do raio
        else:
            distancia = None
        
        motoristas_ativos.append(
            MotoristaAtivo(
                id=usuario.id,
                nome=usuario.nome,
                email=usuario.email,
                telefone=usuario.telefone,
                placa=None,  # TODO: adicionar campo placa no modelo Usuario
                online=status.online,
                lat=status.lat,
                lon=status.lon,
                ultima_localizacao_em=status.ultima_localizacao_em.isoformat() if status.ultima_localizacao_em else None,
                distancia_km=round(distancia, 2) if distancia is not None else None
            )
        )
    
    # Ordena por distância se houver
    if lat is not None and lon is not None:
        motoristas_ativos.sort(key=lambda x: x.distancia_km or 999999)
    
    print(f"✅ Encontrados {len(motoristas_ativos)} motoristas ativos")
    return motoristas_ativos


@roteador.get("/motoristas/{motorista_id}/status")
async def obter_status_motorista(motorista_id: int, sessao: AsyncSession = Depends(obter_sessao)):
    """
    Retorna o status online/offline atual do motorista
    """
    res = await sessao.execute(
        sa.select(MotoristaStatus).where(MotoristaStatus.motorista_id == motorista_id)
    )
    status = res.scalars().first()
    
    if not status:
        return {
            "motorista_id": motorista_id,
            "online": False,
            "lat": None,
            "lon": None,
            "ultima_localizacao_em": None
        }
    
    return {
        "motorista_id": motorista_id,
        "online": status.online,
        "lat": status.lat,
        "lon": status.lon,
        "ultima_localizacao_em": status.ultima_localizacao_em.isoformat() if status.ultima_localizacao_em else None
    }


@roteador.get("/motoristas/{motorista_id}/corridas-proximas")
async def listar_corridas_proximas(
    motorista_id: int,
    lat: float = Query(..., description="Latitude atual do motorista"),
    lon: float = Query(..., description="Longitude atual do motorista"),
    raio_km: float = Query(1.5, description="Raio máximo em km"),
    sessao: AsyncSession = Depends(obter_sessao)
):
    """
    Lista corridas pendentes (estado='buscando') próximas ao motorista (máx 1.5km)
    Exclui corridas que o motorista já recusou há menos de 2 minutos
    """
    from ..modelos.recusa_corrida import RecusaCorrida
    from datetime import datetime, timedelta
    
    # Busca corridas pendentes
    query = sa.select(Corrida).where(
        Corrida.estado == 'buscando',
        Corrida.motorista_id.is_(None)
    )
    res = await sessao.execute(query)
    corridas = res.scalars().all()
    
    # Busca recusas recentes do motorista (últimos 2 minutos)
    dois_minutos_atras = datetime.utcnow() - timedelta(minutes=2)
    query_recusas = sa.select(RecusaCorrida.corrida_id).where(
        RecusaCorrida.motorista_id == motorista_id,
        RecusaCorrida.criado_em >= dois_minutos_atras
    )
    res_recusas = await sessao.execute(query_recusas)
    corridas_recusadas_ids = [r for r in res_recusas.scalars().all()]
    
    # Filtra por distância e remove recusadas recentemente
    corridas_proximas = []
    for corrida in corridas:
        # Ignora se motorista recusou recentemente
        if corrida.id in corridas_recusadas_ids:
            continue
        
        distancia = haversine_km(lat, lon, corrida.origem_lat, corrida.origem_lon)
        if distancia <= raio_km:
            corridas_proximas.append({
                "id": corrida.id,
                "origem_lat": corrida.origem_lat,
                "origem_lon": corrida.origem_lon,
                "destino_lat": corrida.destino_lat,
                "destino_lon": corrida.destino_lon,
                "origem_endereco": corrida.origem_endereco,
                "destino_endereco": corrida.destino_endereco,
                "distancia_km": corrida.distancia_km,
                "duracao_min": corrida.duracao_min,
                "preco_motorista": corrida.preco_motorista,
                "distancia_ate_origem_km": round(distancia, 2),
                "criado_em": corrida.criado_em.isoformat() if corrida.criado_em else None
            })
    
    # Ordena por proximidade
    corridas_proximas.sort(key=lambda x: x["distancia_ate_origem_km"])
    
    print(f"🔍 Motorista {motorista_id}: {len(corridas_proximas)} corridas próximas (raio {raio_km}km)")
    return corridas_proximas


@roteador.post("/motoristas/{motorista_id}/corridas/{corrida_id}/aceitar")
async def aceitar_corrida(
    motorista_id: int,
    corrida_id: int,
    sessao: AsyncSession = Depends(obter_sessao)
):
    """Motorista aceita uma corrida"""
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    corrida = res.scalars().first()
    
    if not corrida:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    
    if corrida.estado != 'buscando':
        raise HTTPException(status_code=400, detail="Corrida não está mais disponível")
    
    # Aceita a corrida
    corrida.motorista_id = motorista_id
    corrida.estado = 'aceita'
    corrida.aceito_em = datetime.utcnow()
    
    await sessao.commit()
    await sessao.refresh(corrida)
    
    print(f"✅ Motorista {motorista_id} aceitou corrida {corrida_id}")
    
    return {
        "id": corrida.id,
        "estado": corrida.estado,
        "motorista_id": corrida.motorista_id,
        "aceito_em": corrida.aceito_em.isoformat() if corrida.aceito_em else None
    }


@roteador.post("/motoristas/{motorista_id}/corridas/{corrida_id}/recusar")
async def recusar_corrida(
    motorista_id: int,
    corrida_id: int,
    sessao: AsyncSession = Depends(obter_sessao)
):
    """Motorista recusa uma corrida - registra no banco por 2 minutos"""
    from ..modelos.recusa_corrida import RecusaCorrida
    
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    corrida = res.scalars().first()
    
    if not corrida:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    
    # Registra a recusa
    recusa = RecusaCorrida(
        corrida_id=corrida_id,
        motorista_id=motorista_id
    )
    sessao.add(recusa)
    await sessao.commit()
    
    print(f"❌ Motorista {motorista_id} recusou corrida {corrida_id}")
    
    return {"ok": True, "mensagem": "Corrida recusada"}


@roteador.delete("/motoristas/recusas/limpeza")
async def limpar_recusas_antigas(sessao: AsyncSession = Depends(obter_sessao)):
    """Remove recusas com mais de 2 minutos (executado periodicamente)"""
    from ..modelos.recusa_corrida import RecusaCorrida
    from datetime import datetime, timedelta
    
    dois_minutos_atras = datetime.utcnow() - timedelta(minutes=2)
    
    query = sa.delete(RecusaCorrida).where(RecusaCorrida.criado_em < dois_minutos_atras)
    result = await sessao.execute(query)
    await sessao.commit()
    
    qtd_removida = result.rowcount
    print(f"🗑️ Removidas {qtd_removida} recusas antigas (>2 min)")
    
    return {"removidas": qtd_removida}

