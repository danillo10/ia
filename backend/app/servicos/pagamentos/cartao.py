from .base import PagamentoProvider, EstadoPagamento

class CartaoProvider(PagamentoProvider):
    async def iniciar(self, valor: float, token_cartao: str):
        return {"estado": EstadoPagamento.AUTORIZADO}
    async def capturar(self, pagamento_id: str):
        return {"estado": EstadoPagamento.CAPTURADO}
    async def estornar(self, pagamento_id: str):
        return {"estado": EstadoPagamento.ESTORNADO}
