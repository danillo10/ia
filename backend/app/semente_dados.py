import asyncio
import bcrypt as bcrypt_lib
from sqlalchemy.ext.asyncio import AsyncSession
from .core.db import AsyncSessaoLocal, Base, engine
from .modelos.usuario import Usuario

USUARIOS = [
    ("Administrador", "admin@mototaxi.local", "admin123", "admin", "(81) 99999-0000"),
    ("Passageiro Demo", "passageiro1@mototaxi.local", "123456", "passageiro", "(81) 91234-5678"),
    ("Motociclista Demo", "moto1@mototaxi.local", "123456", "motociclista", "(81) 98765-4321"),
]

async def criar_base():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def semear():
    await criar_base()
    async with AsyncSessaoLocal() as sessao:  # type: AsyncSession
        for nome, email, senha, papel, telefone in USUARIOS:
            existe = (await sessao.execute(
                __import__('sqlalchemy').select(Usuario).where(Usuario.email == email)
            )).scalars().first()
            if not existe:
                # Usa bcrypt direto para hash da senha
                senha_bytes = senha.encode('utf-8')
                senha_hash = bcrypt_lib.hashpw(senha_bytes, bcrypt_lib.gensalt()).decode('utf-8')
                u = Usuario(
                    nome=nome,
                    email=email,
                    senha_hash=senha_hash,
                    papel=papel,
                    telefone=telefone
                )
                sessao.add(u)
        await sessao.commit()
        print(f"✅ {len(USUARIOS)} usuários criados com sucesso!")

if __name__ == "__main__":
    asyncio.run(semear())
