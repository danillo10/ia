"""
Roteadores para admin - listagem de corridas e estatísticas
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.core.deps import obter_db
from app.modelos.corrida import Corrida
from app.esquemas.corrida import CorridaCompleta

roteador = APIRouter(prefix="/corridas", tags=["admin"])


@roteador.get("", response_model=List[CorridaCompleta])
async def listar_todas_corridas(
    db: AsyncSession = Depends(obter_db)
):
    """
    Lista todas as corridas do sistema com informações completas de passageiro e motorista.
    Usado pelo painel admin.
    """
    resultado = await db.execute(
        select(Corrida)
        .options(
            selectinload(Corrida.passageiro),
            selectinload(Corrida.motorista)
        )
        .order_by(Corrida.criado_em.desc())
    )
    corridas = resultado.scalars().all()
    
    print(f"📋 Admin: {len(corridas)} corridas encontradas")
    
    return corridas
