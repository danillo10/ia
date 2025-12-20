import asyncio
from app.core.db import AsyncSessaoLocal
from app.modelos.usuario import Usuario
import sqlalchemy as sa

async def atualizar():
    async with AsyncSessaoLocal() as s:
        # Atualiza telefone do motorista
        r = await s.execute(sa.select(Usuario).where(Usuario.id == 3))
        u = r.scalar_one()
        u.telefone = "(81) 98765-4321"
        
        # Atualiza telefone do passageiro
        r2 = await s.execute(sa.select(Usuario).where(Usuario.id == 2))
        u2 = r2.scalar_one()
        u2.telefone = "(81) 91234-5678"
        
        await s.commit()
        print("✅ Telefones atualizados!")

asyncio.run(atualizar())
