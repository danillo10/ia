from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Float, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.db import Base


class MensagemChat(Base):
    __tablename__ = "mensagens_chat"

    id = Column(Integer, primary_key=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas.id"), nullable=False, index=True)
    remetente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    # texto | sistema | proposta_valor
    tipo = Column(String(32), default="texto")
    texto = Column(Text, nullable=False)
    valor = Column(Float, nullable=True)
    # pendente | aceita | recusada (propostas de valor)
    proposta_status = Column(String(16), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    remetente = relationship("Usuario", foreign_keys=[remetente_id])
