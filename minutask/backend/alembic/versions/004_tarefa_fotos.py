"""fotos da tarefa

Revision ID: 004
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "tarefa_fotos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tarefa_id", sa.Integer(), sa.ForeignKey("tarefas.id"), nullable=False),
        sa.Column("caminho", sa.String(512), nullable=False),
        sa.Column("ordem", sa.Integer(), server_default="0"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tarefa_fotos_tarefa_id", "tarefa_fotos", ["tarefa_id"])


def downgrade():
    op.drop_index("ix_tarefa_fotos_tarefa_id", table_name="tarefa_fotos")
    op.drop_table("tarefa_fotos")
