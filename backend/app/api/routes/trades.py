"""Trade ledger read route."""
from fastapi import APIRouter

from app.ledger.table import LEDGER

router = APIRouter()


@router.get("/trades")
def trades() -> dict:
    return {"trades": LEDGER.list()}
