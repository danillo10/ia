from fastapi import APIRouter

roteador = APIRouter(prefix="/sistema", tags=["Sistema"])

@roteador.get("/saude")
async def saude():
    return {"status": "ok"}
