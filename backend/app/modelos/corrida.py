from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.db import Base

class Corrida(Base):
    __tablename__ = 'corridas'
    id = Column(Integer, primary_key=True)
    passageiro_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    motorista_id = Column(Integer, ForeignKey('usuarios.id'), nullable=True)
    estado = Column(String(32), default='buscando')  # buscando, aceita, iniciada, em_andamento, finalizada, cancelada

    # Coordenadas GPS
    origem_lat = Column(Float, nullable=False)
    origem_lon = Column(Float, nullable=False)
    destino_lat = Column(Float, nullable=False)
    destino_lon = Column(Float, nullable=False)
    
    # Endereços (nomes legíveis)
    origem_endereco = Column(Text, nullable=True)
    destino_endereco = Column(Text, nullable=True)

    distancia_km = Column(Float, default=0)
    duracao_min = Column(Float, default=0)
    preco_estimado = Column(Float, default=0)  # Preço que o passageiro paga
    preco_motorista = Column(Float, default=0)  # Preço que o motorista recebe (55%)
    preco_final = Column(Float, default=0)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    aceito_em = Column(DateTime(timezone=True), nullable=True)
    iniciado_em = Column(DateTime(timezone=True), nullable=True)
    finalizado_em = Column(DateTime(timezone=True), nullable=True)

    passageiro = relationship('Usuario', foreign_keys=[passageiro_id])
    motorista = relationship('Usuario', foreign_keys=[motorista_id])
