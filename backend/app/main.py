"""GridMesh FastAPI entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, ticks, trades, scenarios, reports, blockchain, quant, simulate
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
app.include_router(scenarios.router)
app.include_router(reports.router)
app.include_router(blockchain.router)
app.include_router(quant.router)
app.include_router(simulate.router)
app.include_router(ws_router)


@app.get("/")
def root() -> dict:
    return {"service": "gridmesh", "docs": "/docs"}
