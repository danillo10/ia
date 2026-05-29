from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Text, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.db import Base


class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True)
    contratante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    trabalhador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    # buscando, aceita, em_andamento, finalizada, cancelada
    estado = Column(String(32), default="buscando")
    descricao = Column(Text, nullable=False)
    categoria = Column(String(64), nullable=True)
    # ponto = local único + valor fixo; rota = paradas + valor por hora
    tipo_loc = Column(String(16), default="ponto")
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    endereco = Column(Text, nullable=True)
    pontos_rota_json = Column(Text, nullable=True)
    distancia_km = Column(Float, default=0)
    horas_contratadas = Column(Float, default=0)
    valor_hora_base = Column(Float, default=50.0)
    taxa_app = Column(Float, default=0)
    valor_fixo = Column(Float, default=0)
    valor_publicado = Column(Float, default=0)
    negociavel = Column(Boolean, default=True)
    valor_sugerido = Column(Float, default=0)
    valor_final = Column(Float, default=0)
    valor_acordado = Column(Float, nullable=True)
    busca_ativa = Column(Boolean, default=True)
    agendado_para = Column(DateTime(timezone=True), nullable=True)
    busca_expira_em = Column(DateTime(timezone=True), nullable=True)
    tentativas_busca = Column(Integer, default=0)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    aceito_em = Column(DateTime(timezone=True), nullable=True)
    iniciado_em = Column(DateTime(timezone=True), nullable=True)
    finalizado_em = Column(DateTime(timezone=True), nullable=True)

    contratante = relationship("Usuario", foreign_keys=[contratante_id])
    trabalhador = relationship("Usuario", foreign_keys=[trabalhador_id])
    fotos = relationship("TarefaFoto", back_populates="tarefa", order_by="TarefaFoto.ordem")


class TarefaRecusa(Base):
    """Trabalhador que recusou não deve receber nova oferta da mesma tarefa."""

    __tablename__ = "tarefa_recusas"
    __table_args__ = (UniqueConstraint("tarefa_id", "trabalhador_id", name="uq_tarefa_trabalhador"),)

    id = Column(Integer, primary_key=True)
    tarefa_id = Column(Integer, ForeignKey("tarefas.id"), nullable=False)
    trabalhador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
