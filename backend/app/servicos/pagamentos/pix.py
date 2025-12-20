from .base import PagamentoProvider, EstadoPagamento

class PixProvider(PagamentoProvider):
    async def iniciar(self, valor: float):
        return {"estado": EstadoPagamento.INICIADO, "qr_code": "qr-mock"}
    async def capturar(self, pagamento_id: str):
        return {"estado": EstadoPagamento.CAPTURADO}
    async def estornar(self, pagamento_id: str):
        return {"estado": EstadoPagamento.ESTORNADO}
