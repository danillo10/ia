from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..servicos.notificacoes import hub_notificacoes

roteador = APIRouter(tags=["WebSocket"])


@roteador.websocket("/ws/trabalhador/{trabalhador_id}")
async def ws_trabalhador(trabalhador_id: int, websocket: WebSocket):
    await hub_notificacoes.registrar_trabalhador(trabalhador_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub_notificacoes.trabalhadores.get(trabalhador_id, set()).discard(websocket)


@roteador.websocket("/ws/contratante/{contratante_id}")
async def ws_contratante(contratante_id: int, websocket: WebSocket):
    """Canal global do contratante — chat, aceite de pedido, etc."""
    await hub_notificacoes.registrar_contratante(contratante_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub_notificacoes.contratantes.get(contratante_id, set()).discard(websocket)


@roteador.websocket("/ws/tarefas/{tarefa_id}")
async def ws_tarefa(tarefa_id: int, websocket: WebSocket):
    await hub_notificacoes.registrar_contratante_tarefa(tarefa_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        hub_notificacoes.contratantes_tarefa.get(tarefa_id, set()).discard(websocket)
