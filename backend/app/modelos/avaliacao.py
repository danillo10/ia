from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..core.db import Base

class Avaliacao(Base):
    __tablename__ = 'avaliacoes'
    id = Column(Integer, primary_key=True)
    corrida_id = Column(Integer, ForeignKey('corridas.id'), nullable=False)
    avaliador_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    avaliado_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    nota = Column(Integer, nullable=False)
    comentario = Column(String(500), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
