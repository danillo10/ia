import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import config

Base = declarative_base()


def _resolver_database_url() -> str:
    if config.database_url:
        return config.database_url
    env_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or os.getenv("MYSQLDATABASE_URL")
    if env_url:
        # Railway MySQL usa mysql:// — SQLAlchemy async precisa aiomysql
        if env_url.startswith("mysql://"):
            return env_url.replace("mysql://", "mysql+aiomysql://", 1)
        return env_url
    if config.db_tipo == "sqlite":
        return config.database_url_sqlite
    return config.database_url_mysql


DATABASE_URL = _resolver_database_url()

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

AsyncSessaoLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False, autocommit=False
)


async def obter_sessao() -> AsyncSession:
    async with AsyncSessaoLocal() as session:
        yield session
