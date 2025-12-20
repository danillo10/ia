from .base import PagamentoProvider, EstadoPagamento

class DinheiroProvider(PagamentoProvider):
    async def iniciar(self, valor: float):
        return {"estado": EstadoPagamento.INICIADO}
    async def capturar(self, pagamento_id: str):
        return {"estado": EstadoPagamento.CAPTURADO}
    async def estornar(self, pagamento_id: str):
        return {"estado": EstadoPagamento.ESTORNADO}
