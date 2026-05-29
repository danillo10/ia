"""
Hub de notificações em memória para WebSocket (dev).
Produção: FCM + tópico trabalhadores_online.
"""
from typing import Dict, Set
from fastapi import WebSocket


class HubNotificacoes:
    def __init__(self):
        self.trabalhadores: Dict[int, Set[WebSocket]] = {}
        self.contratantes: Dict[int, Set[WebSocket]] = {}
        self.contratantes_tarefa: Dict[int, Set[WebSocket]] = {}

    async def registrar_trabalhador(self, trabalhador_id: int, ws: WebSocket):
        await ws.accept()
        self.trabalhadores.setdefault(trabalhador_id, set()).add(ws)

    async def registrar_contratante(self, contratante_id: int, ws: WebSocket):
        await ws.accept()
        self.contratantes.setdefault(contratante_id, set()).add(ws)

    async def registrar_contratante_tarefa(self, tarefa_id: int, ws: WebSocket):
        await ws.accept()
        self.contratantes_tarefa.setdefault(tarefa_id, set()).add(ws)

    async def _enviar(self, conexoes: Set[WebSocket], payload: dict):
        mortas = []
        for ws in list(conexoes):
            try:
                await ws.send_json(payload)
            except Exception:
                mortas.append(ws)
        for ws in mortas:
            conexoes.discard(ws)

    async def broadcast_nova_tarefa(self, payload: dict, exceto_trabalhador_ids: set[int] | None = None):
        exceto = exceto_trabalhador_ids or set()
        for tid, sockets in self.trabalhadores.items():
            if tid in exceto:
                continue
            await self._enviar(sockets, {"evento": "nova_tarefa", **payload})

    async def broadcast_tarefa_encerrada(self, tarefa_id: int, trabalhador_id: int):
        msg = {
            "evento": "tarefa_aceita",
            "tarefa_id": tarefa_id,
            "trabalhador_id": trabalhador_id,
        }
        for sockets in self.trabalhadores.values():
            await self._enviar(sockets, msg)

    async def notificar_contratante(self, tarefa_id: int, payload: dict):
        sockets = self.contratantes_tarefa.get(tarefa_id, set())
        await self._enviar(sockets, payload)

    async def notificar_contratante_usuario(self, contratante_id: int, payload: dict):
        sockets = self.contratantes.get(contratante_id, set())
        await self._enviar(sockets, payload)

    async def broadcast_chat_mensagem(self, tarefa_id: int, contratante_id: int, payload: dict):
        msg = {"evento": "chat_mensagem", **payload}
        await self._enviar(self.contratantes_tarefa.get(tarefa_id, set()), msg)
        await self._enviar(self.contratantes.get(contratante_id, set()), msg)


hub_notificacoes = HubNotificacoes()
