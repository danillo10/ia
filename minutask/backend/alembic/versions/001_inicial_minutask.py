"""inicial minutask

Revision ID: 001
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("telefone", sa.String(32)),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column("papel", sa.String(32), nullable=False),
        sa.Column("ativo", sa.Boolean(), server_default="1"),
        sa.Column("verificacao_status", sa.String(32), server_default="pendente"),
        sa.Column("online", sa.Boolean(), server_default="0"),
        sa.Column("lat", sa.Float()),
        sa.Column("lon", sa.Float()),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_usuarios_email", "usuarios", ["email"], unique=True)

    op.create_table(
        "tarefas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("contratante_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("trabalhador_id", sa.Integer(), sa.ForeignKey("usuarios.id")),
        sa.Column("estado", sa.String(32), server_default="buscando"),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.Column("categoria", sa.String(64)),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("endereco", sa.Text()),
        sa.Column("valor_sugerido", sa.Float(), server_default="0"),
        sa.Column("valor_final", sa.Float(), server_default="0"),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("aceito_em", sa.DateTime(timezone=True)),
        sa.Column("iniciado_em", sa.DateTime(timezone=True)),
        sa.Column("finalizado_em", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "tarefa_recusas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tarefa_id", sa.Integer(), sa.ForeignKey("tarefas.id"), nullable=False),
        sa.Column("trabalhador_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("tarefa_id", "trabalhador_id", name="uq_tarefa_trabalhador"),
    )

    op.create_table(
        "documentos_verificacao",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("caminho_arquivo", sa.String(512), nullable=False),
        sa.Column("tipo", sa.String(32), server_default="documento"),
        sa.Column("status", sa.String(32), server_default="pendente"),
        sa.Column("motivo", sa.Text()),
        sa.Column("confianca", sa.Float()),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("documentos_verificacao")
    op.drop_table("tarefa_recusas")
    op.drop_table("tarefas")
    op.drop_table("usuarios")
