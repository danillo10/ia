"""agendado_para na tarefa

Revision ID: 006
Revises: 005
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tarefas",
        sa.Column("agendado_para", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column("tarefas", "agendado_para")
