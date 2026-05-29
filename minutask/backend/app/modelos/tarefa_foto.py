from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.db import Base


class TarefaFoto(Base):
    __tablename__ = "tarefa_fotos"

    id = Column(Integer, primary_key=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas.id"), nullable=False, index=True)
    caminho = Column(String(512), nullable=False)
    ordem = Column(Integer, default=0)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    tarefa = relationship("Tarefa", back_populates="fotos")
