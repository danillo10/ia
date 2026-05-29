"""rota, preço fixo e busca 2min

Revision ID: 002
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tarefas", sa.Column("tipo_loc", sa.String(16), server_default="ponto"))
    op.add_column("tarefas", sa.Column("pontos_rota_json", sa.Text()))
    op.add_column("tarefas", sa.Column("distancia_km", sa.Float(), server_default="0"))
    op.add_column("tarefas", sa.Column("horas_contratadas", sa.Float(), server_default="0"))
    op.add_column("tarefas", sa.Column("valor_hora_base", sa.Float(), server_default="50"))
    op.add_column("tarefas", sa.Column("taxa_app", sa.Float(), server_default="0"))
    op.add_column("tarefas", sa.Column("valor_fixo", sa.Float(), server_default="0"))
    op.add_column("tarefas", sa.Column("valor_publicado", sa.Float(), server_default="0"))
    op.add_column("tarefas", sa.Column("negociavel", sa.Boolean(), server_default="0"))
    op.add_column("tarefas", sa.Column("busca_ativa", sa.Boolean(), server_default="1"))
    op.add_column("tarefas", sa.Column("busca_expira_em", sa.DateTime(timezone=True)))
    op.add_column("tarefas", sa.Column("tentativas_busca", sa.Integer(), server_default="0"))


def downgrade():
    for col in (
        "tentativas_busca",
        "busca_expira_em",
        "busca_ativa",
        "negociavel",
        "valor_publicado",
        "valor_fixo",
        "taxa_app",
        "valor_hora_base",
        "horas_contratadas",
        "distancia_km",
        "pontos_rota_json",
        "tipo_loc",
    ):
        op.drop_column("tarefas", col)
