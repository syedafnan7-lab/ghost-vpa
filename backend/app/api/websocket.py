from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.api.websocket_manager import ws_manager

router = APIRouter(tags=["Real-time Stream"])

@router.websocket("/ws/live-stream")
async def websocket_live_stream(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open; clients can ping or receive events
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
