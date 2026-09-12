"""Trade ledger read route."""
from fastapi import APIRouter

from app.ledger.table import LEDGER

router = APIRouter()


@router.get("/trades")
def trades(limit: int = 100, offset: int = 0) -> dict:
    all_trades = LEDGER.list()
    return {
        "trades": all_trades[offset : offset + limit],
        "total": len(all_trades),
        "limit": limit,
        "offset": offset,
    }
