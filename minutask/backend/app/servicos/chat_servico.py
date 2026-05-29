"""Mensagens de sistema, propostas de valor e serialização do chat."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..modelos.mensagem import MensagemChat
from ..modelos.tarefa import Tarefa
from ..modelos.usuario import Usuario
from ..servicos.notificacoes import hub_notificacoes

AVISO_PAGAMENTO = (
    "Nunca adiante valor nem parte do pagamento ao trabalhador. "
    "O pagamento é feito somente após a conclusão do serviço, pela plataforma Minutask."
)
AVISO_NEGOCIACAO = (
    "Vocês podem combinar um valor final neste chat. "
    "Toque em «Propor valor» — a outra parte precisa aceitar para valer."
)


def serializar_mensagem(
    msg: MensagemChat,
    usuario_id: int,
    remetente_nome: str | None = None,
) -> dict:
    nome = remetente_nome or (msg.remetente.nome if msg.remetente else "Minutask")
    if msg.tipo == "sistema":
        nome = "Minutask"
    return {
        "id": msg.id,
        "tarefa_id": msg.tarefa_id,
        "remetente_id": msg.remetente_id,
        "remetente_nome": nome,
        "tipo": msg.tipo or "texto",
        "texto": msg.texto,
        "valor": msg.valor,
        "proposta_status": msg.proposta_status,
        "criado_em": msg.criado_em.isoformat() if msg.criado_em else None,
        "minha": msg.remetente_id == usuario_id if msg.remetente_id else False,
    }


async def garantir_avisos_sistema(sessao: AsyncSession, tarefa_id: int) -> None:
    res = await sessao.execute(
        select(MensagemChat.id).where(
            MensagemChat.tarefa_id == tarefa_id,
            MensagemChat.tipo == "sistema",
        )
    )
    if res.first():
        return
    for texto in (AVISO_PAGAMENTO, AVISO_NEGOCIACAO):
        sessao.add(
            MensagemChat(
                tarefa_id=tarefa_id,
                remetente_id=None,
                tipo="sistema",
                texto=texto,
            )
        )
    await sessao.commit()


async def broadcast_mensagem(tarefa: Tarefa, dados: dict) -> None:
    await hub_notificacoes.broadcast_chat_mensagem(tarefa.id, tarefa.contratante_id, dados)


async def proposta_pendente(sessao: AsyncSession, tarefa_id: int) -> MensagemChat | None:
    res = await sessao.execute(
        select(MensagemChat)
        .where(
            MensagemChat.tarefa_id == tarefa_id,
            MensagemChat.tipo == "proposta_valor",
            MensagemChat.proposta_status == "pendente",
        )
        .order_by(MensagemChat.id.desc())
        .limit(1)
    )
    return res.scalars().first()


def valor_vigente(tarefa: Tarefa) -> float:
    if tarefa.valor_acordado and tarefa.valor_acordado > 0:
        return float(tarefa.valor_acordado)
    return float(tarefa.valor_publicado or tarefa.valor_sugerido or 0)
