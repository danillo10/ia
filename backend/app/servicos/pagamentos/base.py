from enum import Enum

class EstadoPagamento(str, Enum):
    INICIADO = "iniciado"
    AUTORIZADO = "autorizado"
    CAPTURADO = "capturado"
    ESTORNADO = "estornado"
    FALHOU = "falhou"

class PagamentoProvider:
    async def iniciar(self, *args, **kwargs):
        raise NotImplementedError
    async def capturar(self, *args, **kwargs):
        raise NotImplementedError
    async def estornar(self, *args, **kwargs):
        raise NotImplementedError
