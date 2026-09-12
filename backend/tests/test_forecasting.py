from app.agents.forecasting import ForecastingAgent
from app.agents.graph import run_tick


def test_forecasting_agent_produces_ml_predictions():
    agent = ForecastingAgent()
    sample_state = {
        "rows": [
            {"participant_id": "solar_home", "load_kw": 0.5, "gen_kw": 2.0},
            {"participant_id": "commercial", "load_kw": 4.5, "gen_kw": 0.0},
        ],
        "tick": 40,
    }
    result = agent.run(sample_state)
    assert "forecasts" in result
    assert len(result["forecasts"]) == 2
    assert "forecast_model" in result
    assert "forecast_rationale" in result

    f0 = result["forecasts"][0]
    assert f0["participant_id"] == "solar_home"
    assert isinstance(f0["predicted_load_kw"], float)
    assert isinstance(f0["predicted_gen_kw"], float)
    assert f0["predicted_load_kw"] >= 0.0
    assert f0["predicted_gen_kw"] >= 0.0


def test_forecasting_agent_handles_unknown_participant():
    agent = ForecastingAgent()
    sample_state = {
        "rows": [
            {"participant_id": "unknown_microgrid_node_99", "load_kw": 1.2, "gen_kw": 0.3},
        ],
        "tick": 12,
    }
    result = agent.run(sample_state)
    assert len(result["forecasts"]) == 1
    f = result["forecasts"][0]
    assert f["participant_id"] == "unknown_microgrid_node_99"
    assert f["predicted_load_kw"] >= 0.0
    assert f["predicted_gen_kw"] >= 0.0


def test_full_pipeline_with_ml_forecaster():
    rows = [
        {"participant_id": "solar_home", "load_kw": 0.18, "gen_kw": 0.0},
        {"participant_id": "household", "load_kw": 0.25, "gen_kw": 0.0},
    ]
    state = run_tick(rows, 1)
    assert state["forecasts"]
    assert state["forecast_model"] == "Ensemble(RandomForest + XGBoost)"
    assert "Ensemble ML" in state["forecast_rationale"]
