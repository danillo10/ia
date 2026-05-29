import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa

from ..core.db import obter_sessao
from ..core.deps import exigir_papeis
from ..modelos.tarefa import Tarefa
from ..modelos.usuario import Usuario
from ..servicos.rabbitmq import rabbitmq_service
from ..servicos.notificacoes import hub_notificacoes
from ..servicos.fotos_tarefa import fotos_por_tarefas, listar_fotos_tarefa, salvar_fotos_tarefa
from ..servicos.tarefa_servico import (
    aplicar_dados_tarefa,
    dados_fila,
    limpar_recusas,
    parse_agendado,
    serializar_tarefa,
    validar_criacao,
    parse_pontos,
)
from ..servicos.geo import distancia_rota_km
from ..servicos.tarifacao import calcular_valor_rota, horas_minimas_pela_distancia

roteador = APIRouter(prefix="/contratante", tags=["Contratante"])


@roteador.post("/tarefas/estimar")
async def estimar_tarefa(
    payload: dict,
    _: Usuario = Depends(exigir_papeis("contratante")),
):
    """Prévia de distância e valor para rota ou ponto."""
    tipo = (payload.get("tipo_loc") or "ponto").strip().lower()
    if tipo == "rota":
        pontos = parse_pontos(payload)
        if len(pontos) < 2:
            raise HTTPException(status_code=400, detail="Informe pelo menos 2 paradas na rota")
        coords = [(p["lat"], p["lon"]) for p in pontos]
        dist_km = distancia_rota_km(coords)
        horas_min = horas_minimas_pela_distancia(dist_km)
        horas = float(payload.get("horas_contratadas") or horas_min)
        precos = calcular_valor_rota(horas)
        return {
            "tipo_loc": "rota",
            "distancia_km": dist_km,
            "horas_minimas": horas_min,
            "horas_contratadas": precos["horas_contratadas"],
            "valor_publicado": precos["valor_publicado"],
            "valor_trabalhador": precos["valor_trabalhador"],
            "taxa_app": precos["taxa_app"],
            "detalhe": f"R$ 50/h + 20% app × {precos['horas_contratadas']}h",
        }
    valor = float(payload.get("valor_fixo") or payload.get("valor_sugerido") or 0)
    return {
        "tipo_loc": "ponto",
        "valor_publicado": round(max(valor, 0), 2),
        "negociavel": True,
        "detalhe": "Valor inicial — pode ser negociado no chat",
    }


@roteador.post("/tarefas")
async def criar_tarefa(
    payload: dict,
    usuario: Usuario = Depends(exigir_papeis("contratante")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    descricao = (payload.get("descricao") or "").strip()
    if len(descricao) < 10:
        raise HTTPException(status_code=400, detail="Descreva o serviço com pelo menos 10 caracteres")

    try:
        tipo, pontos, precos = validar_criacao(payload)
        agendado = parse_agendado(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    tarefa = Tarefa(
        contratante_id=usuario.id,
        descricao=descricao,
        categoria=payload.get("categoria"),
        estado="buscando",
        tentativas_busca=0,
        agendado_para=agendado,
    )
    aplicar_dados_tarefa(tarefa, tipo, pontos, precos, reiniciar_busca=True)
    sessao.add(tarefa)
    await sessao.commit()
    await sessao.refresh(tarefa)

    dados = dados_fila(tarefa, fotos=[])
    await rabbitmq_service.publicar_nova_tarefa(dados)
    await hub_notificacoes.broadcast_nova_tarefa(dados)

    return serializar_tarefa(tarefa, fotos=[])


@roteador.post("/tarefas/{tarefa_id}/fotos")
async def enviar_fotos_tarefa(
    tarefa_id: int,
    fotos: list[UploadFile] = File(...),
    usuario: Usuario = Depends(exigir_papeis("contratante")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    """Fotos do local/serviço (até 5 por pedido, 5 MB cada)."""
    tarefa = await _obter_tarefa_do_contratante(sessao, tarefa_id, usuario.id)
    if tarefa.estado == "cancelada":
        raise HTTPException(status_code=400, detail="Pedido cancelado")

    salvas = await salvar_fotos_tarefa(sessao, tarefa_id, fotos)
    todas = await listar_fotos_tarefa(sessao, tarefa_id)

    if tarefa.estado == "buscando" and tarefa.busca_ativa:
        dados = dados_fila(tarefa, fotos=todas)
        await rabbitmq_service.publicar_nova_tarefa(dados)
        await hub_notificacoes.broadcast_nova_tarefa(dados)

    return {"fotos": salvas, "total": len(todas)}


@roteador.get("/tarefas")
async def listar_tarefas(
    usuario: Usuario = Depends(exigir_papeis("contratante")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    """Pedidos do contratante (dashboard — recentes primeiro)."""
    res = await sessao.execute(
        sa.select(Tarefa)
        .where(Tarefa.contratante_id == usuario.id)
        .order_by(Tarefa.id.desc())
        .limit(50)
    )
    tarefas = res.scalars().all()
    mapa_fotos = await fotos_por_tarefas(sessao, [t.id for t in tarefas])
    alterou = False
    lista = []
    for t in tarefas:
        antes = t.busca_ativa
        item = serializar_tarefa(t, fotos=mapa_fotos.get(t.id, []))
        if antes and not t.busca_ativa:
            alterou = True
        lista.append(item)
    if alterou:
        await sessao.commit()
    return lista


@roteador.get("/tarefas/{tarefa_id}")
async def obter_tarefa(
    tarefa_id: int,
    usuario: Usuario = Depends(exigir_papeis("contratante")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _obter_tarefa_do_contratante(sessao, tarefa_id, usuario.id)
    fotos = await listar_fotos_tarefa(sessao, tarefa_id)
    dados = serializar_tarefa(tarefa, fotos=fotos)
    await sessao.commit()
    return dados


@roteador.post("/tarefas/{tarefa_id}/reenviar")
async def reenviar_tarefa(
    tarefa_id: int,
    payload: dict,
    usuario: Usuario = Depends(exigir_papeis("contratante")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    """Após 2 min sem aceite: aumentar valor/horas e notificar trabalhadores de novo."""
    tarefa = await _obter_tarefa_do_contratante(sessao, tarefa_id, usuario.id)
    if tarefa.estado != "buscando":
        raise HTTPException(status_code=400, detail="Só é possível reenviar tarefas aguardando trabalhador")

    if not serializar_tarefa(tarefa)["pode_reenviar"]:
        raise HTTPException(
            status_code=400,
            detail="Aguarde 2 minutos sem aceite antes de reenviar",
        )

    valor_anterior = float(tarefa.valor_publicado or tarefa.valor_sugerido or 0)
    tipo = tarefa.tipo_loc or "ponto"

    if tipo == "rota":
        horas = float(payload.get("horas_contratadas") or tarefa.horas_contratadas or 1)
        pontos = parse_pontos({"pontos_rota": payload.get("pontos_rota")})
        if not pontos and tarefa.pontos_rota_json:
            pontos = json.loads(tarefa.pontos_rota_json)
        if len(pontos) < 2:
            raise HTTPException(status_code=400, detail="Rota inválida")
        coords = [(p["lat"], p["lon"]) for p in pontos]
        dist_km = distancia_rota_km(coords)
        horas_min = horas_minimas_pela_distancia(dist_km)
        if horas < horas_min:
            raise HTTPException(status_code=400, detail=f"Mínimo de {horas_min}h para esta rota")
        precos = calcular_valor_rota(horas)
        precos["distancia_km"] = dist_km
        if precos["valor_publicado"] <= valor_anterior:
            raise HTTPException(
                status_code=400,
                detail="Aumente as horas ou o valor total antes de reenviar",
            )
        aplicar_dados_tarefa(tarefa, tipo, pontos, precos, reiniciar_busca=True)
    else:
        novo_valor = float(payload.get("valor_fixo") or payload.get("valor_publicado") or 0)
        if novo_valor <= valor_anterior:
            raise HTTPException(
                status_code=400,
                detail="O novo valor fixo deve ser maior que o anterior",
            )
        from ..servicos.tarifacao import calcular_valor_ponto

        pontos = parse_pontos({"pontos_rota": payload.get("pontos_rota")})
        if not pontos:
            pontos = [{"lat": tarefa.lat, "lon": tarefa.lon, "endereco": tarefa.endereco}]
        precos = calcular_valor_ponto(novo_valor)
        aplicar_dados_tarefa(tarefa, tipo, pontos, precos, reiniciar_busca=True)

    await limpar_recusas(sessao, tarefa.id)
    await sessao.commit()
    await sessao.refresh(tarefa)

    fotos = await listar_fotos_tarefa(sessao, tarefa.id)
    dados = dados_fila(tarefa, fotos=fotos)
    await rabbitmq_service.publicar_nova_tarefa(dados)
    await hub_notificacoes.broadcast_nova_tarefa(dados)

    return serializar_tarefa(tarefa, fotos=fotos)


@roteador.post("/tarefas/{tarefa_id}/cancelar")
async def cancelar_tarefa(
    tarefa_id: int,
    usuario: Usuario = Depends(exigir_papeis("contratante")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _obter_tarefa_do_contratante(sessao, tarefa_id, usuario.id)
    if tarefa.estado not in ("buscando", "aceita"):
        raise HTTPException(status_code=400, detail="Não é possível cancelar neste estado")
    tarefa.estado = "cancelada"
    tarefa.busca_ativa = False
    await sessao.commit()
    await rabbitmq_service.publicar_tarefa_encerrada(tarefa.id, tarefa.trabalhador_id or 0)
    return {"ok": True, "estado": tarefa.estado}


async def _obter_tarefa_do_contratante(sessao: AsyncSession, tarefa_id: int, contratante_id: int) -> Tarefa:
    res = await sessao.execute(
        sa.select(Tarefa).where(Tarefa.id == tarefa_id, Tarefa.contratante_id == contratante_id)
    )
    tarefa = res.scalars().first()
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return tarefa
