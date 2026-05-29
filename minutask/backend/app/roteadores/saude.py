from fastapi import APIRouter

roteador = APIRouter(tags=["Sistema"])


@roteador.get("/saude")
async def saude():
    return {"status": "ok", "produto": "Minutask", "mensagem": "Microjobs urgentes"}
