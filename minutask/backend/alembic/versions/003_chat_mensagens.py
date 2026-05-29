"""chat mensagens

Revision ID: 003
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mensagens_chat",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tarefa_id", sa.Integer(), sa.ForeignKey("tarefas.id"), nullable=False),
        sa.Column("remetente_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_mensagens_chat_tarefa_id", "mensagens_chat", ["tarefa_id"])


def downgrade():
    op.drop_index("ix_mensagens_chat_tarefa_id", table_name="mensagens_chat")
    op.drop_table("mensagens_chat")
