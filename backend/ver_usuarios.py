import asyncio
from app.core.db import AsyncSessaoLocal
from app.modelos.usuario import Usuario
import sqlalchemy as sa

async def ver():
    async with AsyncSessaoLocal() as s:
        res = await s.execute(sa.select(Usuario))
        usuarios = res.scalars().all()
        print("\n📋 Usuários no banco:")
        for u in usuarios:
            print(f"  ID: {u.id} | Nome: {u.nome} | Email: {u.email} | Papel: {u.papel}")
            print(f"     Hash: {u.senha_hash[:80]}...")
        print()

asyncio.run(ver())
