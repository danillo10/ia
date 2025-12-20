from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.db import Base

class RecusaCorrida(Base):
    __tablename__ = 'recusas_corridas'
    
    id = Column(Integer, primary_key=True)
    corrida_id = Column(Integer, ForeignKey('corridas.id'), nullable=False)
    motorista_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    corrida = relationship('Corrida', backref='recusas')
    motorista = relationship('Usuario', foreign_keys=[motorista_id])
