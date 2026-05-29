from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa

from ..core.db import obter_sessao
from ..core.deps import obter_usuario_atual
from ..modelos.tarefa import Tarefa
from ..modelos.usuario import Usuario
from ..modelos.mensagem import MensagemChat
from ..servicos.chat_servico import (
    broadcast_mensagem,
    garantir_avisos_sistema,
    proposta_pendente,
    serializar_mensagem,
    valor_vigente,
)

roteador = APIRouter(prefix="/chat", tags=["Chat"])

ESTADOS_CHAT = ("aceita", "em_andamento", "finalizada")


async def _tarefa_com_acesso(
    sessao: AsyncSession, tarefa_id: int, usuario: Usuario
) -> Tarefa:
    res = await sessao.execute(sa.select(Tarefa).where(Tarefa.id == tarefa_id))
    tarefa = res.scalars().first()
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    if tarefa.estado not in ESTADOS_CHAT:
        raise HTTPException(status_code=400, detail="Chat indisponível para esta tarefa")
    if usuario.id == tarefa.contratante_id or usuario.id == tarefa.trabalhador_id:
        return tarefa
    raise HTTPException(status_code=403, detail="Sem acesso ao chat desta tarefa")


async def _listar_serializadas(sessao: AsyncSession, tarefa_id: int, usuario_id: int) -> list[dict]:
    res = await sessao.execute(
        sa.select(MensagemChat, Usuario.nome)
        .outerjoin(Usuario, MensagemChat.remetente_id == Usuario.id)
        .where(MensagemChat.tarefa_id == tarefa_id)
        .order_by(MensagemChat.id.asc())
        .limit(200)
    )
    return [
        serializar_mensagem(msg, usuario_id, nome)
        for msg, nome in res.all()
    ]


@roteador.get("/tarefas/{tarefa_id}/mensagens")
async def listar_mensagens(
    tarefa_id: int,
    usuario: Usuario = Depends(obter_usuario_atual),
    sessao: AsyncSession = Depends(obter_sessao),
):
    await _tarefa_com_acesso(sessao, tarefa_id, usuario)
    await garantir_avisos_sistema(sessao, tarefa_id)
    return await _listar_serializadas(sessao, tarefa_id, usuario.id)


@roteador.post("/tarefas/{tarefa_id}/mensagens")
async def enviar_mensagem(
    tarefa_id: int,
    payload: dict,
    usuario: Usuario = Depends(obter_usuario_atual),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _tarefa_com_acesso(sessao, tarefa_id, usuario)
    if tarefa.estado == "finalizada":
        raise HTTPException(status_code=400, detail="Tarefa finalizada — chat somente leitura")

    texto = (payload.get("texto") or "").strip()
    if len(texto) < 1:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    if len(texto) > 2000:
        raise HTTPException(status_code=400, detail="Mensagem muito longa")

    msg = MensagemChat(
        tarefa_id=tarefa_id,
        remetente_id=usuario.id,
        tipo="texto",
        texto=texto,
    )
    sessao.add(msg)
    await sessao.commit()
    await sessao.refresh(msg)

    dados = serializar_mensagem(msg, usuario.id, usuario.nome)
    await broadcast_mensagem(tarefa, dados)
    return dados


@roteador.post("/tarefas/{tarefa_id}/propor-valor")
async def propor_valor(
    tarefa_id: int,
    payload: dict,
    usuario: Usuario = Depends(obter_usuario_atual),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _tarefa_com_acesso(sessao, tarefa_id, usuario)
    if tarefa.estado == "finalizada":
        raise HTTPException(status_code=400, detail="Tarefa finalizada")

    valor = float(payload.get("valor") or 0)
    if valor <= 0:
        raise HTTPException(status_code=400, detail="Informe um valor válido")

    pendente = await proposta_pendente(sessao, tarefa_id)
    if pendente:
        raise HTTPException(status_code=400, detail="Já existe uma proposta aguardando resposta")

    msg = MensagemChat(
        tarefa_id=tarefa_id,
        remetente_id=usuario.id,
        tipo="proposta_valor",
        texto=f"Proposta de valor: R$ {valor:.2f}",
        valor=round(valor, 2),
        proposta_status="pendente",
    )
    sessao.add(msg)
    await sessao.commit()
    await sessao.refresh(msg)

    dados = serializar_mensagem(msg, usuario.id, usuario.nome)
    await broadcast_mensagem(tarefa, dados)
    return dados


@roteador.post("/tarefas/{tarefa_id}/propostas/{mensagem_id}/responder")
async def responder_proposta(
    tarefa_id: int,
    mensagem_id: int,
    payload: dict,
    usuario: Usuario = Depends(obter_usuario_atual),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _tarefa_com_acesso(sessao, tarefa_id, usuario)
    if tarefa.estado == "finalizada":
        raise HTTPException(status_code=400, detail="Tarefa finalizada")

    res = await sessao.execute(
        sa.select(MensagemChat).where(
            MensagemChat.id == mensagem_id,
            MensagemChat.tarefa_id == tarefa_id,
            MensagemChat.tipo == "proposta_valor",
        )
    )
    proposta = res.scalars().first()
    if not proposta or proposta.proposta_status != "pendente":
        raise HTTPException(status_code=404, detail="Proposta não encontrada ou já respondida")
    if proposta.remetente_id == usuario.id:
        raise HTTPException(status_code=400, detail="Você não pode responder sua própria proposta")

    aceitar = bool(payload.get("aceitar", False))
    proposta.proposta_status = "aceita" if aceitar else "recusada"
    await sessao.commit()

    if aceitar and proposta.valor:
        tarefa.valor_acordado = proposta.valor
        tarefa.valor_final = proposta.valor
        await sessao.commit()

    acao = "aceitou" if aceitar else "recusou"
    valor_txt = f"R$ {proposta.valor:.2f}" if proposta.valor else ""
    sistema = MensagemChat(
        tarefa_id=tarefa_id,
        remetente_id=None,
        tipo="sistema",
        texto=(
            f"{usuario.nome} {acao} a proposta de {valor_txt}."
            + (f" Valor acordado: {valor_txt}." if aceitar else "")
        ),
    )
    sessao.add(sistema)
    await sessao.commit()
    await sessao.refresh(sistema)

    dados_proposta = serializar_mensagem(proposta, usuario.id)
    dados_sistema = serializar_mensagem(sistema, usuario.id)
    await broadcast_mensagem(tarefa, dados_proposta)
    await broadcast_mensagem(tarefa, dados_sistema)

    return {
        "proposta": dados_proposta,
        "sistema": dados_sistema,
        "valor_acordado": tarefa.valor_acordado,
    }


@roteador.get("/tarefas/{tarefa_id}/resumo")
async def resumo_chat(
    tarefa_id: int,
    usuario: Usuario = Depends(obter_usuario_atual),
    sessao: AsyncSession = Depends(obter_sessao),
):
    tarefa = await _tarefa_com_acesso(sessao, tarefa_id, usuario)
    outro_id = tarefa.trabalhador_id if usuario.id == tarefa.contratante_id else tarefa.contratante_id
    outro_nome = None
    if outro_id:
        res = await sessao.execute(sa.select(Usuario).where(Usuario.id == outro_id))
        outro = res.scalars().first()
        outro_nome = outro.nome if outro else None

    pendente = await proposta_pendente(sessao, tarefa_id)
    return {
        "tarefa_id": tarefa.id,
        "descricao": tarefa.descricao,
        "estado": tarefa.estado,
        "outro_nome": outro_nome,
        "pode_enviar": tarefa.estado in ("aceita", "em_andamento"),
        "valor_publicado": tarefa.valor_publicado,
        "valor_acordado": tarefa.valor_acordado,
        "valor_vigente": valor_vigente(tarefa),
        "sou_contratante": usuario.id == tarefa.contratante_id,
        "proposta_pendente_id": pendente.id if pendente else None,
        "proposta_pendente_minha": pendente.remetente_id == usuario.id if pendente else False,
        "aviso_pagamento": (
            "Nunca adiante valor ao trabalhador. Pagamento somente após concluir o serviço."
        ),
    }
