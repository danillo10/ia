from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa
from ..core.deps import exigir_papel
from ..core.db import obter_sessao
from ..modelos.corrida import Corrida
from ..servicos.roteamento import estimar_rota_e_tempo
from ..servicos.tarifacao import calcular_preco_passageiro, calcular_preco_motorista

roteador = APIRouter(prefix="/corridas", tags=["Passageiro"])  # reutiliza /corridas

@roteador.post("")
async def criar_corrida(payload: dict, passageiro = Depends(lambda usuario=Depends(lambda: None): None), sessao: AsyncSession = Depends(obter_sessao), usuario_atual = Depends(lambda: None)):
    # Usar exigir_papel para passageiro
    from ..core.deps import obter_usuario_atual
    from ..servicos.rabbitmq import rabbitmq_service
    
    usuario_atual = await obter_usuario_atual()  # workaround simples
    if usuario_atual.papel not in ("passageiro", "admin"):
        raise HTTPException(status_code=403, detail="Apenas passageiro pode criar corrida")
    
    origem = payload.get("origem")
    destino = payload.get("destino")
    rota = await estimar_rota_e_tempo((origem["lat"], origem["lon"]), (destino["lat"], destino["lon"]))
    
    # Calcula preço total que passageiro paga (R$ 2,10/km)
    preco_passageiro = calcular_preco_passageiro(rota["distancia_km"], rota["duracao_min"])
    # Calcula quanto motorista recebe (55% do total)
    preco_motorista = calcular_preco_motorista(preco_passageiro)
    
    c = Corrida(
        passageiro_id=usuario_atual.id,
        origem_lat=origem["lat"], origem_lon=origem["lon"],
        destino_lat=destino["lat"], destino_lon=destino["lon"],
        origem_endereco=origem.get("endereco"),
        destino_endereco=destino.get("endereco"),
        distancia_km=rota["distancia_km"], duracao_min=rota["duracao_min"],
        preco_estimado=preco_passageiro,  # Passageiro paga este valor (100%)
        preco_motorista=preco_motorista,   # Motorista recebe este valor (55%)
        estado='buscando'
    )
    sessao.add(c)
    await sessao.commit()
    await sessao.refresh(c)
    
    # Publica no RabbitMQ para motoristas
    await rabbitmq_service.publicar_nova_corrida({
        "id": c.id,
        "passageiro_id": c.passageiro_id,
        "origem_lat": c.origem_lat,
        "origem_lon": c.origem_lon,
        "destino_lat": c.destino_lat,
        "destino_lon": c.destino_lon,
        "origem_endereco": c.origem_endereco,
        "destino_endereco": c.destino_endereco,
        "distancia_km": c.distancia_km,
        "duracao_min": c.duracao_min,
        "preco_motorista": c.preco_motorista,
        "criado_em": c.criado_em.isoformat() if c.criado_em else None
    })
    
    print(f"✅ Corrida {c.id} criada e publicada no RabbitMQ")
    
    return {"id": c.id, "estado": c.estado, "preco_estimado": c.preco_estimado}

@roteador.get("/{corrida_id}")
async def obter_corrida(corrida_id: int, sessao: AsyncSession = Depends(obter_sessao), usuario = Depends(lambda: None)):
    from ..core.deps import obter_usuario_atual
    usuario_atual = await obter_usuario_atual()
    
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    
    # Passageiro vê o preço com taxa, motorista vê o preço sem taxa
    preco_exibir = c.preco_estimado if usuario_atual.papel == 'passageiro' else c.preco_motorista
    preco_final_exibir = c.preco_final if c.preco_final > 0 else None
    
    return {
        "id": c.id,
        "estado": c.estado,
        "distancia_km": c.distancia_km,
        "duracao_min": c.duracao_min,
        "preco_estimado": preco_exibir,
        "preco_final": preco_final_exibir,
        "passageiro_id": c.passageiro_id,
        "motorista_id": c.motorista_id,
    }

@roteador.post("/{corrida_id}/cancelar")
async def cancelar_corrida(corrida_id: int, sessao: AsyncSession = Depends(obter_sessao)):
    res = await sessao.execute(sa.select(Corrida).where(Corrida.id == corrida_id))
    c = res.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    if c.estado not in ("buscando", "aceita"):
        raise HTTPException(status_code=400, detail="Não é possível cancelar neste estado")
    c.estado = "cancelada"
    await sessao.commit()
    return {"ok": True}
