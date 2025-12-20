from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..core.db import Base

class MotoristaStatus(Base):
    """
    Tabela para rastrear status online/offline e localização em tempo real dos motoristas
    """
    __tablename__ = "motorista_status"

    id = Column(Integer, primary_key=True, index=True)
    motorista_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False, index=True)
    
    # Status
    online = Column(Boolean, default=False, nullable=False)
    ultima_vez_online = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Localização
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    ultima_localizacao_em = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoria
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
