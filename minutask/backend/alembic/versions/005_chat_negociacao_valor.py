"""negociacao valor chat

Revision ID: 005
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tarefas", sa.Column("valor_acordado", sa.Float(), nullable=True))
    op.add_column("mensagens_chat", sa.Column("tipo", sa.String(32), server_default="texto"))
    op.add_column("mensagens_chat", sa.Column("valor", sa.Float(), nullable=True))
    op.add_column("mensagens_chat", sa.Column("proposta_status", sa.String(16), nullable=True))
    op.alter_column("mensagens_chat", "remetente_id", existing_type=sa.Integer(), nullable=True)


def downgrade():
    op.alter_column("mensagens_chat", "remetente_id", existing_type=sa.Integer(), nullable=False)
    op.drop_column("mensagens_chat", "proposta_status")
    op.drop_column("mensagens_chat", "valor")
    op.drop_column("mensagens_chat", "tipo")
    op.drop_column("tarefas", "valor_acordado")
