"""LangGraph wiring: forecast -> health -> optimize -> prosumer -> trade -> regulate."""
from __future__ import annotations

from typing import Any

from app.agents.forecasting import ForecastingAgent
from app.agents.grid_health import GridHealthAgent
from app.agents.optimization import OptimizationAgent
from app.agents.prosumer import ProsumerAgent
from app.agents.regulation import RegulationAgent
from app.agents.trading import TradingAgent

PIPELINE = (
    ForecastingAgent(),
    GridHealthAgent(),
    OptimizationAgent(),
    ProsumerAgent(),
    TradingAgent(),
    RegulationAgent(),
)


def run_tick(rows: list[dict], tick: int) -> dict[str, Any]:
    state: dict[str, Any] = {"rows": rows, "tick": tick}
    for agent in PIPELINE:
        state.update(agent.run(state))
    return state


def build_graph():
    """LangGraph StateGraph. Falls back to run_tick if langgraph is unavailable."""
    try:
        from langgraph.graph import StateGraph  # type: ignore
    except Exception:
        return None
    graph = StateGraph(dict)
    for agent in PIPELINE:
        graph.add_node(agent.name, agent.run)
    names = [a.name for a in PIPELINE]
    graph.set_entry_point(names[0])
    for a, b in zip(names, names[1:]):
        graph.add_edge(a, b)
    graph.set_finish_point(names[-1])
    return graph.compile()
