"""Blockchain read/verify/demo endpoints (Phase 4).

- GET /api/blockchain/chain — all blocks, most recent first.
- GET /api/blockchain/verify — full chain verification via LEDGER.verify_chain().
- GET /api/blockchain/status — audit persistence + server identity for the
  Compliance panel's restart proof (count, latest hash, process start time).
- POST /api/blockchain/demo/tamper — DEV-ONLY guarded corruption of one tick's
  stored row via raw SQL (bypasses the ledger write path) so a verification
  failure can be demonstrated live. Guard: env GRIDMESH_DEMO_MODE must be "1",
  checked at request time; otherwise 403 and no write occurs.
"""
from __future__ import annotations

import datetime
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ledger.table import LEDGER

router = APIRouter(prefix="/api/blockchain")

DEMO_GUARD_VAR = "GRIDMESH_DEMO_MODE"

# Process start timestamp: recorded once at import (i.e. server startup).
# Restarting the server re-imports this module, so the value moves forward —
# exactly what the Compliance panel's "since last restart" badge needs.
# (No uptime/restart route existed before this; confirmed by grep.)
SERVER_STARTED_AT = datetime.datetime.now(datetime.timezone.utc)


def _demo_allowed() -> bool:
    return os.getenv(DEMO_GUARD_VAR) == "1"


@router.get("/chain")
def get_chain() -> dict:
    """Return all blocks, most recent first."""
    blocks = LEDGER.list_blocks()
    return {"total": len(blocks), "blocks": list(reversed(blocks))}


@router.get("/verify")
def verify() -> dict:
    """Run full chain verification and return the result."""
    return LEDGER.verify_chain()


@router.get("/status")
def status() -> dict:
    """Audit persistence + server identity for the restart proof.

    audit_count/latest_audit_hash come from SQLite (durable); a restart
    leaves them unchanged while server_started_at moves forward.
    """
    count = int(
        LEDGER.conn.execute("SELECT COUNT(*) FROM audits").fetchone()[0]
    )
    latest = LEDGER.conn.execute(
        "SELECT audit_hash FROM audits ORDER BY id DESC LIMIT 1"
    ).fetchone()
    return {
        "server_started_at": SERVER_STARTED_AT.isoformat(),
        "audit_count": count,
        "latest_audit_hash": str(latest[0]) if latest else None,
        "demo_mode": _demo_allowed(),
    }


class TamperRequest(BaseModel):
    tick: int


@router.post("/demo/tamper")
def demo_tamper(req: TamperRequest) -> dict:
    """Corrupt one tick's stored row via raw SQL (demo only, guarded).

    Prefers a trade row for the tick (mutates rationale + bumps price);
    falls back to an audit row when the tick has no trades. Returns 404
    when the tick has nothing stored to corrupt.
    """
    if not _demo_allowed():
        raise HTTPException(
            status_code=403,
            detail=(
                f"Refusing: demo tamper endpoint requires {DEMO_GUARD_VAR}=1 "
                "in the server environment."
            ),
        )
    # Raw SQL on the ledger connection — deliberately bypasses append/append_audit.
    trade = LEDGER.conn.execute(
        "SELECT id FROM trades WHERE tick = ? ORDER BY id ASC LIMIT 1",
        (req.tick,),
    ).fetchone()
    if trade is not None:
        LEDGER.conn.execute(
            "UPDATE trades SET rationale = ?, clearing_price = clearing_price + 1.0 "
            "WHERE id = ?",
            ("[DEMO TAMPER] edited directly in DB, bypassing ledger", int(trade[0])),
        )
        return {"tampered": "trades", "tick": req.tick, "row_id": int(trade[0])}
    audit = LEDGER.conn.execute(
        "SELECT id FROM audits WHERE tick = ? ORDER BY id ASC LIMIT 1",
        (req.tick,),
    ).fetchone()
    if audit is not None:
        LEDGER.conn.execute(
            "UPDATE audits SET rationale = ? WHERE id = ?",
            ("[DEMO TAMPER] edited directly in DB, bypassing ledger", int(audit[0])),
        )
        return {"tampered": "audits", "tick": req.tick, "row_id": int(audit[0])}
    raise HTTPException(
        status_code=404,
        detail=f"No trades or audits stored for tick {req.tick}; nothing to tamper.",
    )
