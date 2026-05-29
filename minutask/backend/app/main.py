"""
API Minutask — Microjobs urgentes (isolada do Moto Táxi)
"""
import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import config
from .core.db import Base, engine
from .servicos.rabbitmq import rabbitmq_service
from .roteadores.saude import roteador as saude_router
from .roteadores.auth import roteador as auth_router
from .roteadores.contratante import roteador as contratante_router
from .roteadores.trabalhador import roteador as trabalhador_router
from .roteadores.publico import roteador as publico_router
from .roteadores.chat import roteador as chat_router
from .roteadores.ws import roteador as ws_router


@asynccontextmanager
async def ciclo_vida(_: FastAPI):
    ultimo_erro = None
    tentativas = 3 if "sqlite" in str(engine.url) else 30
    for tentativa in range(tentativas):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            ultimo_erro = None
            break
        except Exception as erro:
            ultimo_erro = erro
            await asyncio.sleep(1 if "sqlite" in str(engine.url) else 2)
    if ultimo_erro:
        raise ultimo_erro
    await rabbitmq_service.conectar()
    yield
    await rabbitmq_service.desconectar()


api = FastAPI(
    title="Minutask API",
    description="Microjobs urgentes — serviços informais estilo Uber",
    version="0.1.0",
    lifespan=ciclo_vida,
)

def _configurar_cors(app: FastAPI) -> None:
    """
    Navegador não aceita allow_origins=['*'] com allow_credentials=True.
    Em dev, libera localhost em qualquer porta (Flutter web :4200, :4201, etc.).
    """
    origens_env = os.getenv("CORS_ORIGINS", "").strip()
    if origens_env:
        origens = [o.strip() for o in origens_env.split(",") if o.strip()]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origens,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["*"],
        )
        return

    if config.ambiente == "desenvolvimento":
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["*"],
        )
        return

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


_configurar_cors(api)

prefixo = config.api_prefix
api.include_router(saude_router)
api.include_router(auth_router, prefix=prefixo)
api.include_router(contratante_router, prefix=prefixo)
api.include_router(trabalhador_router, prefix=prefixo)
api.include_router(publico_router, prefix=prefixo)
api.include_router(chat_router, prefix=prefixo)
api.include_router(ws_router)

Path(config.uploads_dir).mkdir(parents=True, exist_ok=True)
api.mount("/uploads", StaticFiles(directory=config.uploads_dir), name="uploads")
