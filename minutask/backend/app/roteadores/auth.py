import uuid
from pathlib import Path

import bcrypt
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa

from ..core.config import config
from ..core.db import obter_sessao
from ..core.deps import obter_usuario_atual
from ..core.seguranca import criar_token, gerar_hash_senha
from ..modelos.usuario import Usuario
from ..modelos.documento import DocumentoVerificacao
from ..servicos.verificacao_imagem import analisar_imagem_documento

roteador = APIRouter(prefix="/auth", tags=["Autenticação"])


@roteador.post("/entrar")
async def entrar(payload: dict, sessao: AsyncSession = Depends(obter_sessao)):
    email = payload.get("email")
    senha = payload.get("senha")
    if not email or not senha:
        raise HTTPException(status_code=400, detail="Email e senha são obrigatórios")

    res = await sessao.execute(sa.select(Usuario).where(Usuario.email == email))
    usuario = res.scalars().first()
    senha_ok = usuario and bcrypt.checkpw(
        senha.encode("utf-8"),
        usuario.senha_hash.encode("utf-8"),
    )
    if not senha_ok:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token = criar_token({"sub": str(usuario.id), "email": usuario.email, "papel": usuario.papel})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": _serializar_usuario(usuario),
    }


@roteador.get("/eu")
async def usuario_atual(usuario: Usuario = Depends(obter_usuario_atual)):
    """Valida o token e devolve o perfil atual (renovação implícita ao manter sessão)."""
    return {"usuario": _serializar_usuario(usuario)}


@roteador.post("/cadastro")
async def cadastro(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    papel: str = Form("trabalhador"),
    telefone: str | None = Form(None),
    documento: UploadFile | None = File(None),
    sessao: AsyncSession = Depends(obter_sessao),
):
    if papel not in ("contratante", "trabalhador"):
        raise HTTPException(status_code=400, detail="Papel deve ser contratante ou trabalhador")

    existe = await sessao.execute(sa.select(Usuario).where(Usuario.email == email))
    if existe.scalars().first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    usuario = Usuario(
        nome=nome,
        email=email,
        telefone=telefone,
        senha_hash=gerar_hash_senha(senha),
        papel=papel,
        verificacao_status="pendente",
    )
    sessao.add(usuario)
    await sessao.flush()

    if documento and documento.filename:
        uploads = Path(config.uploads_dir)
        uploads.mkdir(parents=True, exist_ok=True)
        ext = Path(documento.filename).suffix or ".jpg"
        caminho = uploads / f"{usuario.id}_{uuid.uuid4().hex}{ext}"
        conteudo = await documento.read()
        caminho.write_bytes(conteudo)

        status, motivo, confianca = analisar_imagem_documento(caminho)
        doc = DocumentoVerificacao(
            usuario_id=usuario.id,
            caminho_arquivo=str(caminho),
            status=status,
            motivo=motivo,
            confianca=confianca,
        )
        sessao.add(doc)
        usuario.verificacao_status = status if status != "pendente" else "pendente"

    await sessao.commit()
    await sessao.refresh(usuario)

    token = criar_token({"sub": str(usuario.id), "email": usuario.email, "papel": usuario.papel})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": _serializar_usuario(usuario),
    }


def _serializar_usuario(usuario: Usuario) -> dict:
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "telefone": usuario.telefone,
        "papel": usuario.papel,
        "verificacao_status": usuario.verificacao_status,
        "online": usuario.online,
    }
