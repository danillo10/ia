from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..core.db import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    telefone = Column(String(32), unique=True, index=True, nullable=True)
    senha_hash = Column(String(255), nullable=False)
    papel = Column(String(32), nullable=False, default="passageiro")  # passageiro|motociclista|admin
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
