"""Tests for What-If Decision Simulation endpoint — POST /api/simulate/decision."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_simulate_solar_surplus_and_full_battery_sells():
    resp = client.post("/api/simulate/decision", json={
        "participant_id": "solar_home",
        "solar_kw": 6.5,
        "load_kw": 1.2,
        "battery_soc_pct": 92.0,
        "p2p_price_inr": 6.20,
        "grid_tariff_inr": 7.80,
        "feeder_threshold_kw": 6.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"]["action"] == "SELL"
    assert data["orderbook"]["side"] == "SELL"
    assert data["orderbook"]["emitted"] is True
    assert data["regulation"]["compliant"] is True
    assert "Exporting" in data["decision"]["rationale"]


def test_simulate_solar_surplus_and_low_battery_charges():
    resp = client.post("/api/simulate/decision", json={
        "participant_id": "solar_home",
        "solar_kw": 4.5,
        "load_kw": 1.0,
        "battery_soc_pct": 40.0,
        "p2p_price_inr": 6.20,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"]["action"] == "CHARGE"
    assert data["orderbook"]["side"] == "HOLD"
    assert data["orderbook"]["emitted"] is False
    assert "Diverting energy to charge" in data["decision"]["rationale"]


def test_simulate_deficit_buys_from_p2p():
    resp = client.post("/api/simulate/decision", json={
        "participant_id": "household",
        "solar_kw": 0.0,
        "load_kw": 3.2,
        "battery_soc_pct": 10.0,
        "p2p_price_inr": 6.20,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"]["action"] == "BUY"
    assert data["orderbook"]["side"] == "BUY"
    assert data["orderbook"]["emitted"] is True
    assert "Emitting P2P Buy Bid" in data["decision"]["rationale"]


def test_simulate_feeder_overload_triggers_stress_and_bess():
    resp = client.post("/api/simulate/decision", json={
        "participant_id": "ev_station",
        "solar_kw": 0.0,
        "load_kw": 7.5,
        "battery_soc_pct": 20.0,
        "feeder_threshold_kw": 6.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["grid_health"]["stressed"] is True
    assert data["grid_health"]["optimization_override"] is not None
    assert "peak_shaving" in data["grid_health"]["optimization_override"]["mode"]


def test_simulate_predatory_price_violates_cerc_ceiling():
    resp = client.post("/api/simulate/decision", json={
        "participant_id": "solar_home",
        "solar_kw": 5.0,
        "load_kw": 1.0,
        "battery_soc_pct": 90.0,
        "p2p_price_inr": 11.50,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["regulation"]["compliant"] is False
    violations = data["regulation"]["violations"]
    assert any(v["rule_id"] == "R-01" for v in violations)
