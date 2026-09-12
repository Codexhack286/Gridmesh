from app.agents.trading import TradingAgent


def test_clearing_pairs_surplus_deficit():
    agent = TradingAgent()
    state = {
        "tick": 1,
        "decisions": [
            {"participant_id": "s1", "action": "sell", "qty_kwh": 0.6},
            {"participant_id": "b1", "action": "buy", "qty_kwh": 0.4},
        ],
    }
    out = agent.run(state)
    assert len(out["trades"]) == 1
    t = out["trades"][0]
    assert t["qty_kwh"] == 0.4
    assert t["clearing_price"] > 0
    assert t["rationale"]
