"""Endpoints públicos para o site web (criar tarefa sem app)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa

from ..core.db import obter_sessao
from ..modelos.tarefa import Tarefa
from ..modelos.usuario import Usuario
from ..servicos.rabbitmq import rabbitmq_service
from ..servicos.notificacoes import hub_notificacoes
from ..servicos.tarefa_servico import aplicar_dados_tarefa, dados_fila, serializar_tarefa, validar_criacao

roteador = APIRouter(prefix="/publico", tags=["Público"])


@roteador.post("/tarefas")
async def criar_tarefa_web(payload: dict, sessao: AsyncSession = Depends(obter_sessao)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Informe o email do contratante")

    res = await sessao.execute(sa.select(Usuario).where(Usuario.email == email))
    contratante = res.scalars().first()
    if not contratante or contratante.papel not in ("contratante", "admin"):
        raise HTTPException(status_code=404, detail="Contratante não encontrado. Cadastre-se no app.")

    descricao = (payload.get("descricao") or "").strip()
    if len(descricao) < 10:
        raise HTTPException(status_code=400, detail="Descreva o serviço com pelo menos 10 caracteres")

    try:
        tipo, pontos, precos = validar_criacao(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    tarefa = Tarefa(
        contratante_id=contratante.id,
        descricao=descricao,
        categoria=payload.get("categoria"),
        estado="buscando",
        tentativas_busca=0,
    )
    aplicar_dados_tarefa(tarefa, tipo, pontos, precos, reiniciar_busca=True)
    sessao.add(tarefa)
    await sessao.commit()
    await sessao.refresh(tarefa)

    dados = dados_fila(tarefa)
    await rabbitmq_service.publicar_nova_tarefa(dados)
    await hub_notificacoes.broadcast_nova_tarefa(dados)

    out = serializar_tarefa(tarefa)
    out["mensagem"] = "Trabalhadores foram notificados"
    return out
