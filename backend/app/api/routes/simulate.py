"""Interactive What-If Simulation endpoint — POST /api/simulate/decision.

Allows users, evaluators, and judges to manually test the multi-agent decision logic
by overriding Solar Generation, Load Demand, Battery SOC %, and P2P Pricing.
Executes the agent decision logic statelessly without advancing the simulation clock
or corrupting the Merkle blockchain ledger.
"""
from __future__ import annotations

from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agents.optimization import _reserve_floor_pct
from app.core import config

router = APIRouter(prefix="/api/simulate")


class WhatIfRequest(BaseModel):
    participant_id: str = Field("solar_home", description="Participant ID being evaluated")
    solar_kw: float = Field(..., ge=0.0, le=25.0, description="Solar PV generation in kW")
    load_kw: float = Field(..., ge=0.0, le=25.0, description="Demand load in kW")
    battery_soc_pct: float = Field(..., ge=0.0, le=100.0, description="Battery State of Charge in %")
    p2p_price_inr: float = Field(6.20, ge=0.0, le=25.0, description="P2P offer/clearing price in ₹/kWh")
    grid_tariff_inr: float = Field(7.80, ge=0.0, le=25.0, description="DISCOM grid reference tariff in ₹/kWh")
    feeder_threshold_kw: float = Field(6.0, ge=1.0, le=50.0, description="Distribution transformer safety threshold in kW")


PARTICIPANT_NAMES: dict[str, str] = {
    "solar_home": "Solar Home A (Prosumer)",
    "household": "Residential Cluster B (Pure Consumer)",
    "commercial": "Commercial Solar C (Large Prosumer)",
    "ev_station": "EV Charging Hub D (Flexible Consumer)",
    "battery_site": "Community BESS E (Storage Node)",
}

# Baseline background loads for other 4 nodes to compute aggregate feeder stress realistically
BASELINE_OTHER_LOADS: dict[str, float] = {
    "solar_home": 1.2,
    "household": 1.8,
    "commercial": 2.6,
    "ev_station": 3.2,
    "battery_site": 0.2,
}


@router.post("/decision")
def simulate_decision(req: WhatIfRequest) -> dict[str, Any]:
    """Statelessly evaluate multi-agent decision, orderbook emission, grid health,
    and CERC compliance for custom user-supplied inputs.
    """
    pid = req.participant_id
    solar = round(req.solar_kw, 2)
    load = round(req.load_kw, 2)
    soc = round(req.battery_soc_pct, 1)
    p2p_price = round(req.p2p_price_inr, 2)
    grid_tariff = round(req.grid_tariff_inr, 2)
    threshold = round(req.feeder_threshold_kw, 2)

    # 1. Net Energy Balance
    net_kw = round(solar - load, 2)
    surplus_kw = max(0.0, net_kw)
    deficit_kw = max(0.0, -net_kw)

    # 2. Preference and Battery Constraints
    prefs_text = config.DEFAULT_PREFERENCES.get(pid, "Maximize self-consumption, sell surplus when battery above 80%")
    reserve_floor = _reserve_floor_pct(pid, config.DEFAULT_PREFERENCES)
    sell_threshold_pct = 80.0

    # 3. Decision Logic
    action = "idle"
    battery_action = "hold"
    qty_kwh = 0.0
    order_type = "NONE"
    order_side = "NONE"
    rationale = ""

    if net_kw > 0.05:
        # Net Surplus
        if soc < sell_threshold_pct:
            action = "charge"
            battery_action = "charge"
            qty_kwh = round(surplus_kw * 0.25, 3)
            order_type = "SELF_STORAGE"
            order_side = "HOLD"
            rationale = (
                f"Surplus of {surplus_kw:.2f} kW detected. Battery SOC is {soc:.1f}%, which is below the "
                f"{sell_threshold_pct:.0f}% export threshold. Diverting energy to charge local battery storage."
            )
        else:
            action = "sell"
            battery_action = "hold"
            qty_kwh = round(surplus_kw * 0.25, 3)
            order_type = "P2P_ASK"
            order_side = "SELL"
            rationale = (
                f"Battery reserve satisfied ({soc:.1f}% >= {sell_threshold_pct:.0f}%). "
                f"Exporting {qty_kwh:.2f} kWh surplus to P2P market @ ₹{p2p_price:.2f}/kWh."
            )
    elif net_kw < -0.05:
        # Net Deficit
        if soc > (reserve_floor + 10.0) and pid in ("battery_site", "solar_home"):
            # Can partially discharge battery if above floor
            action = "discharge"
            battery_action = "discharge"
            qty_kwh = round(min(deficit_kw * 0.25, 1.5), 3)
            order_type = "SELF_DISCHARGE"
            order_side = "HOLD"
            rationale = (
                f"Deficit of {deficit_kw:.2f} kW detected. Battery SOC is {soc:.1f}% (above {reserve_floor:.0f}% floor). "
                f"Discharging {qty_kwh:.2f} kWh from battery to cover demand."
            )
        else:
            action = "buy"
            battery_action = "hold"
            qty_kwh = round(deficit_kw * 0.25, 3)
            order_type = "P2P_BID"
            order_side = "BUY"
            rationale = (
                f"Net deficit of {deficit_kw:.2f} kW detected. Emitting P2P Buy Bid for {qty_kwh:.2f} kWh @ "
                f"₹{p2p_price:.2f}/kWh (saving ₹{(grid_tariff - p2p_price):.2f}/kWh vs DISCOM tariff)."
            )
    else:
        # Balanced
        action = "consume"
        battery_action = "hold"
        qty_kwh = round(load * 0.25, 3)
        order_type = "LOCAL_BALANCE"
        order_side = "NONE"
        rationale = f"Generation matches demand ({load:.2f} kW). Operating in self-consumption balance."

    # 4. Grid Health & Feeder Stress Evaluation
    other_load_sum = sum(v for k, v in BASELINE_OTHER_LOADS.items() if k != pid)
    total_feeder_draw = round(load + other_load_sum, 2)
    is_stressed = total_feeder_draw >= threshold
    optimization_override = None

    if is_stressed:
        peak_excess = round(total_feeder_draw - threshold, 2)
        bess_discharge = round(min(peak_excess, 2.5), 2)
        optimization_override = {
            "mode": "peak_shaving",
            "trigger": f"Feeder draw {total_feeder_draw:.2f} kW exceeds {threshold:.1f} kW safety limit",
            "bess_command": f"Discharge Community BESS at {bess_discharge:.2f} kW to shave peak",
            "relieved_draw_kw": round(total_feeder_draw - bess_discharge, 2),
        }

    # 5. Regulatory Compliance Verification (CERC Open Access Rules)
    reg_violations = []
    if p2p_price > 9.00:
        reg_violations.append({
            "rule_id": "R-01",
            "name": "CERC Price Ceiling (₹9.00/kWh max)",
            "detail": f"Offer price ₹{p2p_price:.2f}/kWh exceeds ₹9.00/kWh statutory cap.",
            "severity": "CRITICAL",
            "enforcement": "BLOCK_TRADE",
        })
    if p2p_price < 4.00 and action == "sell":
        reg_violations.append({
            "rule_id": "R-04",
            "name": "Collusion / Dumping Floor (₹4.00/kWh min)",
            "detail": f"Sell price ₹{p2p_price:.2f}/kWh is below generation cost floor.",
            "severity": "WARNING",
            "enforcement": "FLAG_COLLUSION",
        })
    if qty_kwh > 10.0:
        reg_violations.append({
            "rule_id": "R-02",
            "name": "SERC Volume Quota (10.0 kWh cap)",
            "detail": f"Transaction volume {qty_kwh:.2f} kWh exceeds 10.0 kWh per-trade quota.",
            "severity": "CRITICAL",
            "enforcement": "TRUNCATE_VOLUME",
        })
    if is_stressed and total_feeder_draw > 8.0:
        reg_violations.append({
            "rule_id": "R-05",
            "name": "Distribution Transformer Limit (8.0 kW peak)",
            "detail": f"Feeder loading {total_feeder_draw:.2f} kW breaches DT thermal safety limit.",
            "severity": "HIGH",
            "enforcement": "GRID_THROTTLE",
        })

    is_compliant = len([v for v in reg_violations if v["severity"] == "CRITICAL"]) == 0

    # 6. Financial Settlement Metrics
    unit_savings_inr = round(max(0.0, grid_tariff - p2p_price), 2)
    interval_savings_inr = round(qty_kwh * unit_savings_inr, 2)
    co2_avoided_kg = round(qty_kwh * 0.716, 3)

    return {
        "participant_id": pid,
        "participant_name": PARTICIPANT_NAMES.get(pid, pid),
        "inputs": {
            "solar_kw": solar,
            "load_kw": load,
            "battery_soc_pct": soc,
            "p2p_price_inr": p2p_price,
            "grid_tariff_inr": grid_tariff,
            "feeder_threshold_kw": threshold,
        },
        "net_energy": {
            "net_kw": net_kw,
            "status": "surplus" if net_kw > 0.05 else "deficit" if net_kw < -0.05 else "balanced",
            "surplus_kw": surplus_kw,
            "deficit_kw": deficit_kw,
        },
        "decision": {
            "action": action.upper(),
            "battery_action": battery_action.upper(),
            "qty_kwh": qty_kwh,
            "battery_soc_pct": soc,
            "reserve_floor_pct": reserve_floor,
            "sell_threshold_pct": sell_threshold_pct,
            "rationale": rationale,
        },
        "orderbook": {
            "type": order_type,
            "side": order_side,
            "qty_kwh": qty_kwh,
            "target_price_inr": p2p_price,
            "emitted": order_side in ("BUY", "SELL"),
        },
        "grid_health": {
            "total_feeder_draw_kw": total_feeder_draw,
            "threshold_kw": threshold,
            "stressed": is_stressed,
            "optimization_override": optimization_override,
        },
        "regulation": {
            "compliant": is_compliant,
            "violations": reg_violations,
            "rules_checked": ["R-01 Price Ceiling", "R-02 Volume Quota", "R-04 Dumping Floor", "R-05 DT Feeder Limit"],
        },
        "financial_impact": {
            "unit_savings_inr": unit_savings_inr,
            "interval_savings_inr": interval_savings_inr,
            "co2_avoided_kg": co2_avoided_kg,
        },
    }
