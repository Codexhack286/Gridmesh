"""GridMesh FastAPI entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, ticks, trades
from app.api.websockets import router as ws_router

app = FastAPI(title="GridMesh")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ticks.router)
app.include_router(trades.router)
app.include_router(ws_router)


@app.get("/")
def root() -> dict:
    return {"service": "gridmesh", "docs": "/docs"}
