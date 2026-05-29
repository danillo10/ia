"""Usuários demo para MVP — mesmo padrão do Moto Táxi (senha 123456)."""
import asyncio
import bcrypt as bcrypt_lib
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from .core.db import AsyncSessaoLocal, Base, engine
from .modelos.usuario import Usuario

USUARIOS = [
    ("Contratante Demo", "contratante1@minutask.local", "123456", "contratante", "(81) 91111-1111"),
    ("Trabalhador Demo", "trabalhador1@minutask.local", "123456", "trabalhador", "(81) 92222-2222"),
]


def _hash_senha(senha: str) -> str:
    return bcrypt_lib.hashpw(senha.encode("utf-8"), bcrypt_lib.gensalt()).decode("utf-8")


async def semear():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessaoLocal() as sessao:
        criados = 0
        for nome, email, senha, papel, telefone in USUARIOS:
            existe = (
                await sessao.execute(sa.select(Usuario).where(Usuario.email == email))
            ).scalars().first()
            if existe:
                continue
            sessao.add(
                Usuario(
                    nome=nome,
                    email=email,
                    senha_hash=_hash_senha(senha),
                    papel=papel,
                    telefone=telefone,
                    verificacao_status="aprovado",
                )
            )
            criados += 1
        await sessao.commit()
        print(f"✅ Minutask: {criados} usuário(s) demo criado(s)")


if __name__ == "__main__":
    asyncio.run(semear())
