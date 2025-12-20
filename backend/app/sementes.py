# Atalho para rodar via "python -m app.sementes"
from .semente_dados import semear
import asyncio

if __name__ == "__main__":
    asyncio.run(semear())
