from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.sql import func
from ..core.db import Base


class DocumentoVerificacao(Base):
    __tablename__ = "documentos_verificacao"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    caminho_arquivo = Column(String(512), nullable=False)
    tipo = Column(String(32), default="documento")  # documento|selfie
    status = Column(String(32), default="pendente")
    motivo = Column(Text, nullable=True)
    confianca = Column(Float, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
