"""Criar tabelas iniciais

Revision ID: 001_inicial
Revises: 
Create Date: 2025-12-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_inicial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tabela usuarios
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=120), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('telefone', sa.String(length=32), nullable=True),
        sa.Column('senha_hash', sa.String(length=255), nullable=False),
        sa.Column('papel', sa.String(length=32), nullable=False),
        sa.Column('ativo', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('atualizado_em', sa.DateTime(), nullable=True, onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usuarios_id'), 'usuarios', ['id'], unique=False)
    op.create_index(op.f('ix_usuarios_email'), 'usuarios', ['email'], unique=True)
    op.create_index(op.f('ix_usuarios_telefone'), 'usuarios', ['telefone'], unique=True)
    
    # Tabela corridas
    op.create_table(
        'corridas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('passageiro_id', sa.Integer(), nullable=False),
        sa.Column('motorista_id', sa.Integer(), nullable=True),
        sa.Column('origem_lat', sa.Float(), nullable=False),
        sa.Column('origem_lon', sa.Float(), nullable=False),
        sa.Column('origem_endereco', sa.String(length=512), nullable=True),
        sa.Column('destino_lat', sa.Float(), nullable=False),
        sa.Column('destino_lon', sa.Float(), nullable=False),
        sa.Column('destino_endereco', sa.String(length=512), nullable=True),
        sa.Column('distancia_km', sa.Float(), nullable=True),
        sa.Column('duracao_min', sa.Float(), nullable=True),
        sa.Column('preco_estimado', sa.Float(), nullable=False),
        sa.Column('preco_motorista', sa.Float(), nullable=True),
        sa.Column('preco_final', sa.Float(), nullable=True),
        sa.Column('estado', sa.String(length=32), nullable=False),
        sa.Column('criada_em', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('iniciada_em', sa.DateTime(), nullable=True),
        sa.Column('finalizada_em', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['passageiro_id'], ['usuarios.id'], ),
        sa.ForeignKeyConstraint(['motorista_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabela motorista_status
    op.create_table(
        'motorista_status',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('motorista_id', sa.Integer(), nullable=False),
        sa.Column('online', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('ultima_vez_online', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True, onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('lat', sa.Float(), nullable=True),
        sa.Column('lon', sa.Float(), nullable=True),
        sa.Column('ultima_localizacao_em', sa.DateTime(), nullable=True),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('atualizado_em', sa.DateTime(), nullable=True, onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['motorista_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_motorista_status_id'), 'motorista_status', ['id'], unique=False)
    op.create_index(op.f('ix_motorista_status_motorista_id'), 'motorista_status', ['motorista_id'], unique=True)
    
    # Tabela historico_status_motorista
    op.create_table(
        'historico_status_motorista',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('motorista_id', sa.Integer(), nullable=False),
        sa.Column('online', sa.Boolean(), nullable=False),
        sa.Column('alterado_em', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['motorista_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_historico_status_motorista_id'), 'historico_status_motorista', ['id'], unique=False)
    op.create_index(op.f('ix_historico_status_motorista_motorista_id'), 'historico_status_motorista', ['motorista_id'], unique=False)
    op.create_index(op.f('ix_historico_status_motorista_alterado_em'), 'historico_status_motorista', ['alterado_em'], unique=False)
    
    # Tabela pagamentos
    op.create_table(
        'pagamentos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('corrida_id', sa.Integer(), nullable=False),
        sa.Column('metodo', sa.String(length=32), nullable=False),
        sa.Column('valor', sa.Float(), nullable=False),
        sa.Column('estado', sa.String(length=32), nullable=False),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('processado_em', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['corrida_id'], ['corridas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Tabela avaliacoes
    op.create_table(
        'avaliacoes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('corrida_id', sa.Integer(), nullable=False),
        sa.Column('avaliador_id', sa.Integer(), nullable=False),
        sa.Column('avaliado_id', sa.Integer(), nullable=False),
        sa.Column('nota', sa.Integer(), nullable=False),
        sa.Column('comentario', sa.Text(), nullable=True),
        sa.Column('criada_em', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['corrida_id'], ['corridas.id'], ),
        sa.ForeignKeyConstraint(['avaliador_id'], ['usuarios.id'], ),
        sa.ForeignKeyConstraint(['avaliado_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('avaliacoes')
    op.drop_table('pagamentos')
    op.drop_index(op.f('ix_historico_status_motorista_alterado_em'), table_name='historico_status_motorista')
    op.drop_index(op.f('ix_historico_status_motorista_motorista_id'), table_name='historico_status_motorista')
    op.drop_index(op.f('ix_historico_status_motorista_id'), table_name='historico_status_motorista')
    op.drop_table('historico_status_motorista')
    op.drop_index(op.f('ix_motorista_status_motorista_id'), table_name='motorista_status')
    op.drop_index(op.f('ix_motorista_status_id'), table_name='motorista_status')
    op.drop_table('motorista_status')
    op.drop_table('corridas')
    op.drop_index(op.f('ix_usuarios_telefone'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_email'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_id'), table_name='usuarios')
    op.drop_table('usuarios')
