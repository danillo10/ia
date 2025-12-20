from datetime import datetime, timedelta, timezone
import jwt
from passlib.hash import bcrypt
from .config import config

ALGORITMO = "HS256"

def gerar_hash_senha(senha: str) -> str:
    return bcrypt.hash(senha)

def verificar_senha(senha: str, hash_senha: str) -> bool:
    return bcrypt.verify(senha, hash_senha)

def criar_token(dados: dict, exp_min: int | None = None) -> str:
    to_encode = dados.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=exp_min or config.jwt_tempo_min)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, config.jwt_segredo, algorithm=ALGORITMO)

def verificar_token(token: str) -> dict:
    return jwt.decode(token, config.jwt_segredo, algorithms=[ALGORITMO])
