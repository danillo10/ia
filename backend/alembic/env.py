from __future__ import with_statement
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os, sys

# Adiciona o diretório da aplicação ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Importa Base e todos os modelos
from app.core.db import Base
from app.modelos.usuario import Usuario
from app.modelos.corrida import Corrida
from app.modelos.pagamento import Pagamento
from app.modelos.avaliacao import Avaliacao
from app.modelos.motorista_status import MotoristaStatus
from app.modelos.historico_status_motorista import HistoricoStatusMotorista

# Configuração Alembic
config = context.config
fileConfig(config.config_file_name)

def get_url():
    # Força MySQL para desenvolvimento
    return 'mysql+pymysql://mototaxi:mototaxi@mysql:3306/mototaxi'

# Define o metadata a partir da Base
target_metadata = Base.metadata

def run_migrations_offline():
    url = get_url()
    # Remove o driver assíncrono para Alembic usar driver síncrono
    url = url.replace('+aiomysql', '+pymysql').replace('+asyncpg', '+psycopg2').replace('+aiosqlite', '')
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    from sqlalchemy import create_engine, pool
    
    url = get_url()
    # Remove o driver assíncrono para Alembic usar driver síncrono
    url = url.replace('+aiomysql', '+pymysql').replace('+asyncpg', '+psycopg2').replace('+aiosqlite', '')
    
    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
