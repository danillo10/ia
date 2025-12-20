from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from ..core.db import Base

class Pagamento(Base):
    __tablename__ = 'pagamentos'
    id = Column(Integer, primary_key=True)
    corrida_id = Column(Integer, ForeignKey('corridas.id'), nullable=False)
    provedor = Column(String(16), nullable=False)  # pix, cartao, dinheiro
    estado = Column(String(16), nullable=False, default='iniciado')
    valor = Column(Float, nullable=False, default=0)
    referencia = Column(String(128), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
