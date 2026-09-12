from app.ledger.table import TableLedger


def test_ledger_interface_appends_in_order():
    ledger = TableLedger()
    r0 = ledger.append({"tick": 0, "qty_kwh": 0.5})
    r1 = ledger.append({"tick": 1, "qty_kwh": 0.4})
    assert r0["index"] == 0
    assert r1["index"] == 1
    assert [r["index"] for r in ledger.list()] == [0, 1]
