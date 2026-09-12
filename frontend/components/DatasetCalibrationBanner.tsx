"use client";
import { useState } from "react";
import { Icon } from "./icons";

export function DatasetCalibrationBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="calibration-banner">
        <div className="calibration-banner-left">
          <span className="calibration-tag">Dataset Calibration</span>
          <div className="calibration-text">
            Replaying empirical 15-min smart meter telemetry from <strong>Open Power System Data (OPSD)</strong>, calibrated to Indian solar irradiance, <strong>DISCOM LT tariffs (₹8.00/kWh)</strong>, and <strong>CEA carbon intensity (0.716 kg CO₂/kWh)</strong>.
          </div>
        </div>

        <div className="calibration-pills">
          <span className="calib-pill">OPSD 15-Min Empirical</span>
          <span className="calib-pill">Indian IST / GHI Curve</span>
          <span className="calib-pill">CEA 0.716 kg/kWh</span>
          <span className="calib-pill">DISCOM LT Slab</span>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: expanded ? "var(--current)" : "var(--surface)",
              color: expanded ? "#ffffff" : "var(--current)",
              border: "1px solid var(--current)",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              cursor: "pointer",
              transition: "all 0.16s ease",
            }}
          >
            <span>{expanded ? "Hide Methodology" : "View Conversion Matrix"}</span>
            <Icon name={expanded ? "chevron-up" : "chevron-down"} size={11} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="conversion-drawer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                Empirical Telemetry Adaptation: German OPSD → Indian Microgrid Feeder
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: "var(--slate-soft)", lineHeight: 1.4 }}>
                Synchronized 15-minute prosumer energy readings are mathematically mapped to Indian operational parameters.
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--leaf)", background: "var(--leaf-soft)", padding: "3px 8px", borderRadius: 4 }}>
              CEA &amp; CERC Calibrated
            </span>
          </div>

          <table className="conversion-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Domain</th>
                <th style={{ width: "38%" }}>Raw OPSD Baseline (Germany)</th>
                <th style={{ width: "40%" }}>Indian Microgrid Calibration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Solar Irradiance &amp; Peak</strong></td>
                <td>Temperate latitude (50°N), lower winter yields, solar peak at 12:00–13:00 CET.</td>
                <td>
                  <strong>Tropical High-Insolation (8°–35°N):</strong> Normalized to Indian Global Horizontal Irradiance (GHI 5.5–6.5 kWh/m²/day), solar generation curve peaking 11:30–13:30 IST.
                </td>
              </tr>
              <tr>
                <td><strong>Feeder Load Profile</strong></td>
                <td>Heating-dominant baseload with heavy European winter heat-pump demands.</td>
                <td>
                  <strong>Substation Feeder Profile:</strong> Scaled to Indian residential &amp; commercial patterns — midday air-conditioning demand + evening residential surge (18:00–22:00 IST).
                </td>
              </tr>
              <tr>
                <td><strong>Tariff &amp; Economics</strong></td>
                <td>European feed-in (€0.08/kWh) and utility retail rates (€0.30–0.35/kWh).</td>
                <td>
                  <strong>Indian DISCOM Regime:</strong> DISCOM retail LT tariff (<strong>₹8.00/kWh</strong>), solar net-metering buyback (<strong>₹2.60/kWh</strong>), P2P clearing (<strong>₹5.50/kWh</strong>).
                </td>
              </tr>
              <tr>
                <td><strong>CO₂ Carbon Avoidance</strong></td>
                <td>European grid mix (~0.233 kg CO₂/kWh) with high nuclear and wind generation.</td>
                <td>
                  <strong>Central Electricity Authority (CEA) Baseline v19:</strong> Calibrated to <strong>0.716 kg CO₂/kWh</strong> (~70% thermal coal generation). Local solar avoidance prevents <strong>3.07× more CO₂</strong> in India.
                </td>
              </tr>
              <tr>
                <td><strong>Regulatory Bounds</strong></td>
                <td>European internal energy market and EU Clean Energy Package directives.</td>
                <td>
                  <strong>CERC &amp; SERC Regulations:</strong> CERC Open Access P2P guidelines, SERC net-metering limits (UPERC, DERC, KERC, MERC), and IEGC Distribution Transformer safety limits.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
