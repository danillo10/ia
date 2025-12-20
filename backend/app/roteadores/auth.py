from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa
from datetime import datetime, timedelta
from ..core.db import obter_sessao
from ..modelos.usuario import Usuario
from ..core.seguranca import verificar_senha, criar_token
import bcrypt

roteador = APIRouter(prefix="/auth", tags=["Autenticação"])

@roteador.post("/entrar")
async def entrar(payload: dict, sessao: AsyncSession = Depends(obter_sessao)):
    """
    Realiza login de usuário (passageiro, motociclista ou admin)
    Retorna access_token JWT e dados do usuário
    """
    email = payload.get("email")
    senha = payload.get("senha")
    
    if not email or not senha:
        raise HTTPException(status_code=400, detail="Email e senha são obrigatórios")
    
    # Busca usuário por email
    resultado = await sessao.execute(
        sa.select(Usuario).where(Usuario.email == email)
    )
    usuario = resultado.scalar_one_or_none()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verifica senha usando bcrypt direto (compatível com bcrypt_lib usado em sementes)
    senha_bytes = senha.encode('utf-8')
    senha_hash_bytes = usuario.senha_hash.encode('utf-8')
    
    if not bcrypt.checkpw(senha_bytes, senha_hash_bytes):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Cria token JWT com validade de 30 dias (43200 minutos)
    dados_token = {
        "sub": str(usuario.id),
        "email": usuario.email,
        "papel": usuario.papel
    }
    
    access_token = criar_token(dados_token, exp_min=43200)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "telefone": usuario.telefone,
            "papel": usuario.papel
        }
    }
