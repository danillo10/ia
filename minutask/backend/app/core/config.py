from pydantic_settings import BaseSettings


class Configuracao(BaseSettings):
    app_nome: str = "Minutask"
    ambiente: str = "desenvolvimento"
    tz: str = "America/Recife"

    api_host: str = "0.0.0.0"
    api_port: int = 8001
    api_prefix: str = "/api/v1"

    jwt_segredo: str = "minutask_trocar_em_producao"
    jwt_tempo_min: int = 43200

    # Railway: DATABASE_URL ou MYSQL_URL (convertido em db.py)
    database_url: str | None = None
    db_tipo: str = "sqlite"
    database_url_sqlite: str = "sqlite+aiosqlite:///./minutask_dev.sqlite3"
    database_url_mysql: str = "mysql+aiomysql://minutask:minutask@localhost:3308/minutask"

    rabbitmq_url: str | None = None
    uploads_dir: str = "uploads"
    google_maps_api_key: str | None = None

    class Config:
        env_file = (".env", "../.env")
        env_file_encoding = "utf-8"
        extra = "ignore"


config = Configuracao()
