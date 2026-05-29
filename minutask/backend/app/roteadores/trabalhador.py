from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa

from ..core.db import obter_sessao
from ..core.deps import exigir_papeis
from ..modelos.tarefa import Tarefa, TarefaRecusa
from ..modelos.usuario import Usuario
from ..servicos.rabbitmq import rabbitmq_service
from ..servicos.notificacoes import hub_notificacoes
from ..servicos.tarefa_servico import atualizar_expiracao_busca, serializar_tarefa
from ..servicos.fotos_tarefa import fotos_por_tarefas

roteador = APIRouter(prefix="/trabalhador", tags=["Trabalhador"])


@roteador.put("/status-online")
async def status_online(
    payload: dict,
    usuario: Usuario = Depends(exigir_papeis("trabalhador")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    if usuario.verificacao_status == "rejeitado":
        raise HTTPException(status_code=403, detail="Cadastro não aprovado")
    usuario.online = bool(payload.get("online", False))
    if payload.get("lat") is not None:
        usuario.lat = float(payload["lat"])
    if payload.get("lon") is not None:
        usuario.lon = float(payload["lon"])
    await sessao.commit()
    return {"online": usuario.online}


@roteador.get("/tarefas/disponiveis")
async def listar_disponiveis(
    usuario: Usuario = Depends(exigir_papeis("trabalhador")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    """Tarefas em busca ativa (janela de 2 min) que o trabalhador ainda não recusou."""
    if not usuario.online:
        return []

    recusadas = await sessao.execute(
        sa.select(TarefaRecusa.tarefa_id).where(TarefaRecusa.trabalhador_id == usuario.id)
    )
    ids_recusados = {r[0] for r in recusadas.all()}

    res = await sessao.execute(
        sa.select(Tarefa).where(Tarefa.estado == "buscando", Tarefa.busca_ativa == True)  # noqa: E712
    )
    candidatas = []
    alterou = False
    for t in res.scalars().all():
        antes = t.busca_ativa
        atualizar_expiracao_busca(t)
        if antes and not t.busca_ativa:
            alterou = True
        if not t.busca_ativa or t.id in ids_recusados:
            continue
        candidatas.append(t)

    mapa_fotos = await fotos_por_tarefas(sessao, [t.id for t in candidatas])
    tarefas = [
        serializar_tarefa(t, fotos=mapa_fotos.get(t.id, [])) for t in candidatas
    ]
    if alterou:
        await sessao.commit()
    return tarefas


@roteador.post("/tarefas/{tarefa_id}/aceitar")
async def aceitar_tarefa(
    tarefa_id: int,
    usuario: Usuario = Depends(exigir_papeis("trabalhador")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    if not usuario.online:
        raise HTTPException(status_code=400, detail="Fique online para aceitar tarefas")

    res = await sessao.execute(sa.select(Tarefa).where(Tarefa.id == tarefa_id).with_for_update())
    tarefa = res.scalars().first()
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    atualizar_expiracao_busca(tarefa)
    if tarefa.estado != "buscando" or not tarefa.busca_ativa:
        raise HTTPException(status_code=409, detail="Tarefa indisponível ou busca encerrada")

    tarefa.trabalhador_id = usuario.id
    tarefa.estado = "aceita"
    tarefa.busca_ativa = False
    tarefa.aceito_em = datetime.utcnow()
    tarefa.valor_final = float(
        tarefa.valor_acordado or tarefa.valor_publicado or tarefa.valor_sugerido or 0
    )
    await sessao.commit()

    await rabbitmq_service.publicar_tarefa_encerrada(tarefa.id, usuario.id)
    await hub_notificacoes.broadcast_tarefa_encerrada(tarefa.id, usuario.id)
    await hub_notificacoes.notificar_contratante(
        tarefa.id,
        {"evento": "tarefa_aceita", "trabalhador_id": usuario.id, "tarefa_id": tarefa.id},
    )
    await hub_notificacoes.notificar_contratante_usuario(
        tarefa.contratante_id,
        {
            "evento": "tarefa_aceita",
            "trabalhador_id": usuario.id,
            "tarefa_id": tarefa.id,
            "descricao": tarefa.descricao,
        },
    )

    return {"ok": True, "estado": tarefa.estado, "tarefa_id": tarefa.id, "valor_final": tarefa.valor_final}


@roteador.post("/tarefas/{tarefa_id}/recusar")
async def recusar_tarefa(
    tarefa_id: int,
    usuario: Usuario = Depends(exigir_papeis("trabalhador")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    res = await sessao.execute(sa.select(Tarefa).where(Tarefa.id == tarefa_id))
    tarefa = res.scalars().first()
    if not tarefa or tarefa.estado != "buscando" or not tarefa.busca_ativa:
        raise HTTPException(status_code=400, detail="Tarefa indisponível")

    existe = await sessao.execute(
        sa.select(TarefaRecusa).where(
            TarefaRecusa.tarefa_id == tarefa_id,
            TarefaRecusa.trabalhador_id == usuario.id,
        )
    )
    if not existe.scalars().first():
        sessao.add(TarefaRecusa(tarefa_id=tarefa_id, trabalhador_id=usuario.id))
        await sessao.commit()

    return {"ok": True}


@roteador.post("/tarefas/{tarefa_id}/iniciar")
async def iniciar_tarefa(
    tarefa_id: int,
    usuario: Usuario = Depends(exigir_papeis("trabalhador")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _tarefa_do_trabalhador(sessao, tarefa_id, usuario.id)
    if tarefa.estado != "aceita":
        raise HTTPException(status_code=400, detail="Tarefa não está pronta para iniciar")
    tarefa.estado = "em_andamento"
    tarefa.iniciado_em = datetime.utcnow()
    await sessao.commit()
    return {"estado": tarefa.estado}


@roteador.post("/tarefas/{tarefa_id}/finalizar")
async def finalizar_tarefa(
    tarefa_id: int,
    payload: dict,
    usuario: Usuario = Depends(exigir_papeis("trabalhador")),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _tarefa_do_trabalhador(sessao, tarefa_id, usuario.id)
    if tarefa.estado != "em_andamento":
        raise HTTPException(status_code=400, detail="Tarefa não está em andamento")
    tarefa.estado = "finalizada"
    tarefa.valor_final = float(
        payload.get("valor_final")
        or tarefa.valor_acordado
        or tarefa.valor_publicado
        or tarefa.valor_sugerido
        or 0
    )
    tarefa.finalizado_em = datetime.utcnow()
    await sessao.commit()
    return {"estado": tarefa.estado, "valor_final": tarefa.valor_final}


async def _tarefa_do_trabalhador(sessao: AsyncSession, tarefa_id: int, trabalhador_id: int) -> Tarefa:
    res = await sessao.execute(
        sa.select(Tarefa).where(Tarefa.id == tarefa_id, Tarefa.trabalhador_id == trabalhador_id)
    )
    tarefa = res.scalars().first()
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return tarefa
