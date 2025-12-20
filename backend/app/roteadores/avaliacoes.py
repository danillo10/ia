from fastapi import APIRouter

roteador = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])

@roteador.post("")
async def criar(payload: dict):
    return {"ok": True}

@roteador.get("/motorista/{mid}")
async def listar_motorista(mid: int):
    return {"motorista_id": mid, "media": 5.0, "quantidade": 0}
