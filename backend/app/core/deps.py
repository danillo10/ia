from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.db import obter_sessao
from ..core.seguranca import verificar_token
from ..modelos.usuario import Usuario
import sqlalchemy as sa

async def obter_usuario_atual(authorization: str = Header(None), sessao: AsyncSession = Depends(obter_sessao)) -> Usuario:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token ausente")
    token = authorization.split()[1]
    try:
        dados = verificar_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario_id = dados.get("sub")
    if not usuario_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    res = await sessao.execute(sa.select(Usuario).where(Usuario.id == int(usuario_id)))
    usuario = res.scalars().first()
    if not usuario or not usuario.ativo:
        raise HTTPException(status_code=401, detail="Usuário inativo")
    return usuario

async def exigir_papel(papel: str, usuario: Usuario = Depends(obter_usuario_atual)) -> Usuario:
    if usuario.papel != papel and usuario.papel != 'admin':
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Permissão negada")
    return usuario
