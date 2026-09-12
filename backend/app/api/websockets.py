"""WebSocket live stream: pushes a fresh tick payload per message."""
from __future__ import annotations

from fastapi import APIRouter, WebSocket

from app.api.routes.ticks import tick as run_tick_endpoint

router = APIRouter()


@router.websocket("/ws/stream")
async def stream(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            await ws.receive_text()
            await ws.send_json(run_tick_endpoint())
    except Exception:
        await ws.close()
