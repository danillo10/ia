"""
Aplicação FastAPI do Moto Táxi – 100% em PT-BR
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import config
from .roteadores.saude import roteador as sistema_router
from .roteadores.auth import roteador as auth_router
from .roteadores.corridas import roteador as corridas_router
from .roteadores.passageiro import roteador as passageiro_router
from .roteadores.motorista import roteador as motorista_router
from .roteadores.pagamentos import roteador as pagamentos_router
from .roteadores.avaliacoes import roteador as avaliacoes_router
from .roteadores.geocodificacao import roteador as geocodificacao_router
from .roteadores.admin import roteador as admin_router

api = FastAPI(
    title="Moto Táxi API",
    description="API em português do Brasil para plataforma de moto táxi",
    version="0.1.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

origens = ["*"]
api.add_middleware(
    CORSMiddleware,
    allow_origins=origens,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api.include_router(sistema_router, prefix=config.api_prefix)
api.include_router(auth_router, prefix=config.api_prefix)
api.include_router(corridas_router, prefix=config.api_prefix)
api.include_router(passageiro_router, prefix=f"{config.api_prefix}")
api.include_router(motorista_router, prefix=f"{config.api_prefix}")
api.include_router(pagamentos_router, prefix=f"{config.api_prefix}")
api.include_router(avaliacoes_router, prefix=f"{config.api_prefix}")
api.include_router(geocodificacao_router, prefix=f"{config.api_prefix}")
api.include_router(admin_router, prefix=f"{config.api_prefix}")

@api.get("/saude", tags=["Sistema"])
async def verificar_saude():
    return {"status": "ok", "mensagem": "API funcionando"}

