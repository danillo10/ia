"""
Esquemas Pydantic para validação de corridas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UsuarioSimples(BaseModel):
    """Informações básicas do usuário"""
    id: int
    nome: str
    
    class Config:
        from_attributes = True


class CorridaBase(BaseModel):
    """Campos base de uma corrida"""
    origem_lat: float
    origem_lon: float
    destino_lat: float
    destino_lon: float
    origem_endereco: Optional[str] = None
    destino_endereco: Optional[str] = None


class CorridaCompleta(CorridaBase):
    """Corrida completa com todas as informações"""
    id: int
    passageiro_id: int
    motorista_id: Optional[int] = None
    estado: str
    distancia_km: float
    duracao_min: float
    preco_estimado: float
    preco_motorista: Optional[float] = None
    preco_final: Optional[float] = None
    criado_em: datetime
    aceito_em: Optional[datetime] = None
    iniciado_em: Optional[datetime] = None
    finalizado_em: Optional[datetime] = None
    passageiro: Optional[UsuarioSimples] = None
    motorista: Optional[UsuarioSimples] = None
    
    class Config:
        from_attributes = True


class CorridaCriacao(CorridaBase):
    """Dados para criar uma corrida"""
    distancia_km: float
    duracao_min: float
    preco_estimado: float
    preco_motorista: float
