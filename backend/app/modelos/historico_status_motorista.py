from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..core.db import Base

class HistoricoStatusMotorista(Base):
    """
    Tabela para registrar histórico de quando motorista ficou online/offline
    """
    __tablename__ = "historico_status_motorista"

    id = Column(Integer, primary_key=True, index=True)
    motorista_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    
    # Status alterado
    online = Column(Boolean, nullable=False)
    
    # Quando aconteceu
    alterado_em = Column(DateTime(timezone=True), server_default=func.now(), index=True)
