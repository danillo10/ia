from pydantic_settings import BaseSettings

class Configuracao(BaseSettings):
    app_nome: str = "Moto Táxi"
    ambiente: str = "desenvolvimento"
    tz: str = "America/Recife"

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"

    jwt_segredo: str = "trocar_em_producao"
    jwt_tempo_min: int = 30
    jwt_refresh_min: int = 43200

    db_tipo: str = "mysql"
    database_url_sqlite: str = "sqlite+aiosqlite:///./dados_dev.sqlite3"
    database_url_mysql: str = "mysql+aiomysql://mototaxi:mototaxi@mysql:3306/mototaxi"
    database_url_postgres: str = "postgresql+asyncpg://mototaxi:mototaxi@postgres:5432/mototaxi"

    redis_url: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

config = Configuracao()
