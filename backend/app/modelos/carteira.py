from sqlalchemy import Column, Integer, Float, ForeignKey
from ..core.db import Base

class CarteiraMotorista(Base):
    __tablename__ = 'carteiras_motorista'
    id = Column(Integer, primary_key=True)
    motorista_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    saldo = Column(Float, default=0.0)
