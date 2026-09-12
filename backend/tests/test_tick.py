from app.agents.graph import run_tick


def test_full_tick_produces_explained_outputs():
    rows = [
        {"participant_id": "h1", "load_kw": 0.5, "gen_kw": 2.8},
        {"participant_id": "h3", "load_kw": 0.7, "gen_kw": 0.0},
    ]
    state = run_tick(rows, 1)
    assert state["forecasts"] and state["decisions"]
    assert all(d["rationale"] for d in state["decisions"])
    assert "rationale" in state["stress"]
