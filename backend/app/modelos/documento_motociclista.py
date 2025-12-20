from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from ..core.db import Base

class DocumentoMotociclista(Base):
    __tablename__ = 'documentos_motociclista'

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    cnh = Column(String(64), nullable=True)
    crlv = Column(String(64), nullable=True)
    placa = Column(String(16), nullable=True)
    cor_moto = Column(String(32), nullable=True)
    ano_moto = Column(String(8), nullable=True)
    status = Column(String(16), default='pendente')  # pendente, aprovado, reprovado
    aprovado = Column(Boolean, default=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
