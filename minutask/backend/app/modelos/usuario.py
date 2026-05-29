from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from ..core.db import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    telefone = Column(String(32), unique=True, index=True, nullable=True)
    senha_hash = Column(String(255), nullable=False)
    # contratante | trabalhador | admin
    papel = Column(String(32), nullable=False, default="trabalhador")
    ativo = Column(Boolean, default=True)
    verificacao_status = Column(String(32), default="pendente")  # pendente|aprovado|rejeitado
    online = Column(Boolean, default=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
