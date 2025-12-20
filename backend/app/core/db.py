from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import config

Base = declarative_base()

if config.db_tipo == "sqlite":
    DATABASE_URL = config.database_url_sqlite
elif config.db_tipo == "mysql":
    DATABASE_URL = config.database_url_mysql
else:
    DATABASE_URL = config.database_url_postgres

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

AsyncSessaoLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False, autocommit=False
)

async def obter_sessao() -> AsyncSession:
    async with AsyncSessaoLocal() as session:
        yield session
