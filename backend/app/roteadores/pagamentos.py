from fastapi import APIRouter
from ..servicos.pagamentos.pix import PixProvider
from ..servicos.pagamentos.cartao import CartaoProvider
from ..servicos.pagamentos.dinheiro import DinheiroProvider

roteador = APIRouter(prefix="/pagamentos", tags=["Pagamentos"])

@roteador.post("/iniciar")
async def iniciar(payload: dict):
    prov = payload.get('provedor', 'dinheiro')
    valor = float(payload.get('valor', 0))
    if prov == 'pix':
        return await PixProvider().iniciar(valor)
    if prov == 'cartao':
        return await CartaoProvider().iniciar(valor, payload.get('token','tok_mock'))
    return await DinheiroProvider().iniciar(valor)

@roteador.post("/{pid}/capturar")
async def capturar(pid: str):
    return {"ok": True}

@roteador.post("/{pid}/estornar")
async def estornar(pid: str):
    return {"ok": True}
