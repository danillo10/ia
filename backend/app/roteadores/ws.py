from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

roteador = APIRouter(tags=["Tempo Real"]) 

conexoes: Dict[int, List[WebSocket]] = {}

@roteador.websocket("/ws/corridas/{corrida_id}")
async def ws_corrida(websocket: WebSocket, corrida_id: int):
    await websocket.accept()
    lista = conexoes.setdefault(corrida_id, [])
    lista.append(websocket)
    try:
        while True:
            _ = await websocket.receive_text()
            await websocket.send_text("ok")
    except WebSocketDisconnect:
        conexoes[corrida_id].remove(websocket)
        if not conexoes[corrida_id]:
            conexoes.pop(corrida_id, None)

async def publicar_evento(corrida_id: int, mensagem: str):
    if corrida_id in conexoes:
        for ws in list(conexoes[corrida_id]):
            try:
                await ws.send_text(mensagem)
            except Exception:
                pass
