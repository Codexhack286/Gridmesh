"use client";
import { Icon } from "./icons";

export function PlatformGuide() {
  return (
    <div className="guide-view">
      {/* Hero Section */}
      <div className="guide-hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--current)", background: "var(--current-soft)", padding: "3px 10px", borderRadius: 999, marginBottom: 10 }}>
          Platform Manual &amp; Specification
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "var(--ink)", letterSpacing: "-0.01em" }}>
          GridMesh Operator &amp; Architecture Guide
        </h2>
        <p style={{ fontSize: 14, color: "var(--slate)", margin: 0, maxWidth: 840, lineHeight: 1.55 }}>
          GridMesh is a decentralized microgrid energy coordination and peer-to-peer (P2P) trading platform. Autonomous software agents represent neighborhood households, solar arrays, battery units, and EV charging stations to predict energy needs, negotiate fair local trades, preserve transformer stability, and record settlements into an immutable cryptographic ledger.
        </p>
      </div>

      {/* 2-Column Summary */}
      <div className="guide-grid-2">
        {/* Core Value Proposition */}
        <div className="guide-card">
          <h3 className="section-title-light" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--current)" }}><Icon name="lightning" size={16} /></span>
            The Problem &amp; Core Value
          </h3>
          <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, margin: "6px 0 14px" }}>
            Conventional power grids operate as a centralized one-way pipeline. When prosumers generate rooftop solar surplus, state DISCOMs purchase it at minimal net-metering feed-in tariffs (₹2.60/kWh) and resell it to neighboring households at full retail rates (₹8.00/kWh). Meanwhile, uncoordinated EV charging risks local Distribution Transformer (DT) overload and brownouts.
          </p>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--slate-soft)" }}>Consumer Electricity Savings:</span>
              <strong style={{ color: "var(--leaf)" }}>~31% below DISCOM retail (saves ₹2.50/kWh)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--slate-soft)" }}>Prosumer Export Profit:</span>
              <strong style={{ color: "var(--current)" }}>+112% vs. DISCOM net-metering buyback</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--slate-soft)" }}>Distribution Transformer Protection:</span>
              <strong style={{ color: "var(--ink)" }}>Automated BESS dispatch (&lt;6.0 kW DT limit)</strong>
            </div>
          </div>
        </div>

        {/* 15-Minute Cycle */}
        <div className="guide-card">
          <h3 className="section-title-light" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--voltage)" }}><Icon name="clock" size={16} /></span>
            The 15-Minute Dispatch Cycle
          </h3>
          <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, margin: "6px 0 12px" }}>
            Every simulation tick models a single 15-minute electrical operational dispatch interval (96 ticks represent 24 continuous hours):
          </p>
          <div className="guide-timeline">
            <div className="timeline-item">
              <span className="timeline-num">1</span>
              <div className="timeline-content">
                <h4>Telemetry &amp; ML Forecast</h4>
                <p>Loads real OPSD solar/demand data; XGBoost ensemble predicts conditions 15 minutes ahead.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-num">2</span>
              <div className="timeline-content">
                <h4>Agent Negotiation &amp; Clearing</h4>
                <p>Prosumer agents formulate bids/asks; trading agent clears matches via continuous double auction.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-num">3</span>
              <div className="timeline-content">
                <h4>Compliance Audit &amp; Settlement</h4>
                <p>Rules R-01 to R-05 audit trades; valid records are sealed into a SHA-256 cryptographic block.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Directory Card */}
      <div className="card-light">
        <h3 className="section-title-light" style={{ marginBottom: 4 }}>Workspace Page Directory</h3>
        <p className="section-hint-light" style={{ marginBottom: 18 }}>
          Guide to each functional tab available in the navigation bar.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Tab 1: Overview */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "16px 18px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--current)" }}><Icon name="lightning" size={16} /></span>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Overview (Console)</h4>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Central operator view displaying real-time feeder topology with animated directional current flow (solar, P2P, battery), 3 cumulative KPI cards (P2P Energy, Savings, CO₂ Avoided), dynamic feeder stress alert banner, and 1-click scenario injection controls.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--current)", background: "var(--current-soft)", padding: "2px 8px", borderRadius: 4 }}>
              Primary Live Monitoring
            </span>
          </div>

          {/* Tab 2: Decisions & Market */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "16px 18px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--orange)" }}><Icon name="handshake" size={16} /></span>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Decisions &amp; Market</h4>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Financial market view displaying the continuous double-auction orderbook with live bids and asks, real-time trade settlement ticker showing individual transaction community savings, 15-min load/solar forecast curve, and full historical trade ledger.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--orange)", background: "var(--orange-soft)", padding: "2px 8px", borderRadius: 4 }}>
              Marketplace &amp; Clearing
            </span>
          </div>

          {/* Tab 3: Compliance & Ledger */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "16px 18px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--alert)" }}><Icon name="shield-check" size={16} /></span>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Compliance &amp; Ledger</h4>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Audit center showing real-time enforcement of Rules R-01 to R-05, rolling session statistics, and the verifiable SHA-256 blockchain. Includes interactive Verify Chain and Tamper Demo controls to demonstrate cryptographic security.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--alert)", background: "var(--alert-soft)", padding: "2px 8px", borderRadius: 4 }}>
              Regulatory Shield &amp; Audit
            </span>
          </div>

          {/* Tab 4: Quant Core */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "16px 18px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--voltage)" }}><Icon name="brain" size={16} /></span>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Quant Core</h4>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Machine learning inspection center displaying model validation metrics (Solar R² 95.6%, Demand R² 71.0%, MAE errors), voting ensemble architecture specifications, and live predicted vs. actual telemetry per participant.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--voltage)", background: "var(--voltage-soft)", padding: "2px 8px", borderRadius: 4 }}>
              XGBoost + Random Forest
            </span>
          </div>

          {/* Tab 5: System Design */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "16px 18px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--current)" }}><Icon name="circuitry" size={16} /></span>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>System Design</h4>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Architectural diagram detailing the complete 7-layer technical stack, data pipeline, protocol interfaces, and execution flowcharts connecting physical assets to real-time user interfaces.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--current)", background: "var(--current-soft)", padding: "2px 8px", borderRadius: 4 }}>
              Architecture &amp; Flowchart
            </span>
          </div>

          {/* Tab 6: Platform Guide */}
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "16px 18px", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--leaf)" }}><Icon name="sliders" size={16} /></span>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Platform Guide</h4>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--slate)", margin: "0 0 10px", lineHeight: 1.45 }}>
              Complete reference manual explaining the problem statement, mathematical clearing mechanisms, regulatory rules directory, participant profiles, and judge evaluation criteria.
            </p>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--leaf)", background: "var(--leaf-soft)", padding: "2px 8px", borderRadius: 4 }}>
              Reference Manual
            </span>
          </div>
        </div>
      </div>

      {/* The 6 Agents Table */}
      <div className="card-light">
        <h3 className="section-title-light" style={{ marginBottom: 4 }}>Multi-Agent Intelligence Specification</h3>
        <p className="section-hint-light" style={{ marginBottom: 16 }}>
          Role, reasoning mechanism, and sample output for each autonomous agent.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table className="light-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Core Responsibility</th>
                <th>Reasoning Engine</th>
                <th>Sample Decision / Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Forecasting</strong></td>
                <td>Predicts solar output and load 15-min ahead</td>
                <td>Voting Ensemble (XGBoost + RF)</td>
                <td><em>"Predicted 4.2 kW solar peak; household demand 1.8 kW"</em></td>
              </tr>
              <tr>
                <td><strong>Prosumer (×5)</strong></td>
                <td>Manages local assets, battery SOC &amp; bids</td>
                <td>LLM + State Heuristic</td>
                <td><em>"Battery at 82%; offered 1.6 kWh surplus for sale at ₹5.40/kWh"</em></td>
              </tr>
              <tr>
                <td><strong>Trading</strong></td>
                <td>Matches buyers/sellers, sets clearing price</td>
                <td>Continuous Double Auction</td>
                <td><em>"Matched Solar Home A with EV Hub C at ₹5.50/kWh"</em></td>
              </tr>
              <tr>
                <td><strong>Grid Health</strong></td>
                <td>Monitors feeder load, prevents brownouts</td>
                <td>Threshold Monitoring (&lt;6.0 kW)</td>
                <td><em>"Aggregate load at 5.2 kW; feeder status normal"</em></td>
              </tr>
              <tr>
                <td><strong>Optimization</strong></td>
                <td>Schedules storage, minimizes import costs</td>
                <td>Marginal Cost Arbitrage</td>
                <td><em>"Scheduled Community BESS discharge during evening peak"</em></td>
              </tr>
              <tr>
                <td><strong>Compliance</strong></td>
                <td>Audits trades, enforces Rules R-01 to R-05</td>
                <td>Structured Rule Validator</td>
                <td><em>"Trade verified; price ceiling not exceeded; trade approved"</em></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Rules Card */}
      <div className="card-light">
        <h3 className="section-title-light" style={{ marginBottom: 4 }}>Regulatory Rules Directory</h3>
        <p className="section-hint-light" style={{ marginBottom: 16 }}>
          Enforced automated rules protecting market fairness and physical grid limits.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--alert)" }}>RULE R-01</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginTop: 2 }}>Price Ceiling (CERC)</div>
            <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>Maximum ₹9.00/kWh. CERC tariff ceiling prevents predatory surge pricing above retail grid benchmark.</div>
          </div>
          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sun)" }}>RULE R-02</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginTop: 2 }}>Volume Quota Cap</div>
            <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>Maximum 10.0 kWh per single trade. Enforces SERC distributed solar capacity allocation.</div>
          </div>
          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--voltage)" }}>RULE R-03</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginTop: 2 }}>Self-Trade Guard</div>
            <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>Buyer ID must not equal Seller ID. Rejects wash trading and artificial volume manipulation.</div>
          </div>
          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--current)" }}>RULE R-04</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginTop: 2 }}>Anti-Collusion Floor</div>
            <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>Flags non-competitive coordinated transfers below ₹4.00/kWh between related accounts.</div>
          </div>
          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--alert)" }}>RULE R-05</span>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginTop: 2 }}>Distribution Transformer Limit</div>
            <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 4 }}>Maximum 8.0 kW aggregate load. Halts trade routing that would physically trip substation feeder breakers.</div>
          </div>
        </div>
      </div>

      {/* Dataset Adaptation & Indian Market Calibration Section */}
      <div className="card-light">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <div>
            <h3 className="section-title-light" style={{ margin: 0 }}>
              Dataset Adaptation: German OPSD Telemetry to Indian Microgrid Calibration
            </h3>
            <p className="section-hint-light" style={{ margin: "4px 0 0" }}>
              Technical methodology for deploying high-resolution empirical smart meter data in the Indian electricity ecosystem.
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--leaf)", background: "var(--leaf-soft)", padding: "3px 10px", borderRadius: 999 }}>
            CEA &amp; DISCOM Calibrated
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14 }}>
          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "14px 16px", background: "var(--surface)" }}>
            <h4 style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
              Why Open Power System Data (OPSD)?
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--slate)", lineHeight: 1.5, margin: 0 }}>
              In smart grid research, open public microgrid datasets containing synchronized 15-minute prosumer load, rooftop solar generation, and battery state-of-charge (SOC) at the individual household level are virtually non-existent in India due to DISCOM meter data privacy restrictions. OPSD is the international gold standard providing 14,400 empirical records across 30 days.
            </p>
          </div>

          <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "14px 16px", background: "var(--surface)" }}>
            <h4 style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
              The 5-Point Indian Calibration Engine
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--slate)", lineHeight: 1.5, margin: 0 }}>
              GridMesh ingests empirical telemetry and applies 5 mathematical transformation layers: (1) Solar peak alignment to Indian tropical GHI (11:30–13:30 IST); (2) Feeder load scaling for Indian AC cooling &amp; evening domestic surges; (3) DISCOM LT retail tariff mapping (₹8.00/kWh); (4) CEA grid emission factor recalibration (0.716 kg CO₂/kWh); and (5) CERC / SERC regulatory guardrails.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table className="light-table">
            <thead>
              <tr>
                <th>Conversion Dimension</th>
                <th>Raw OPSD Telemetry (Germany)</th>
                <th>Indian Microgrid Adaptation</th>
                <th>Operational Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Solar Generation Profile</strong></td>
                <td>Temperate latitude (50°N), lower winter insolation, peak 12:00 CET</td>
                <td>Tropical Indian GHI (5.5–6.5 kWh/m²/day), peak generation 11:30–13:30 IST</td>
                <td>Higher solar export volume during peak cooling hours</td>
              </tr>
              <tr>
                <td><strong>Feeder Demand Dynamics</strong></td>
                <td>Space-heating dominated baseload</td>
                <td>Afternoon commercial cooling + pronounced evening domestic surge (18:00–22:00)</td>
                <td>BESS discharge scheduled during evening peak, avoiding transformer overload</td>
              </tr>
              <tr>
                <td><strong>Tariff &amp; Clearing Structure</strong></td>
                <td>European feed-in (€0.08) vs. retail (€0.32)</td>
                <td>DISCOM LT tariff (₹8.00/kWh), net-metering buyback (₹2.60/kWh), P2P (₹5.50/kWh)</td>
                <td>Consumers save ₹2.50/kWh (31%), prosumers earn +112% profit</td>
              </tr>
              <tr>
                <td><strong>Carbon Avoidance Baseline</strong></td>
                <td>EU grid intensity (~0.233 kg CO₂/kWh)</td>
                <td>Central Electricity Authority (CEA) Baseline Database v19 (0.716 kg CO₂/kWh)</td>
                <td>3.07× higher greenhouse gas reduction per kWh traded locally</td>
              </tr>
              <tr>
                <td><strong>Regulatory Guardrails</strong></td>
                <td>EU Clean Energy Package directives</td>
                <td>CERC Open Access P2P framework &amp; SERC Distributed Solar net-metering quotas</td>
                <td>Automated compliance protection against predatory pricing &amp; wash trading</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Telemetry Ingestion & Hardware Architecture FAQ */}
      <div className="card-light">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <div>
            <h3 className="section-title-light" style={{ margin: 0 }}>
              <Icon name="circuitry" size={16} />
              <span>Production Telemetry Architecture: How Do 15-Minute Readings Reach the Platform?</span>
            </h3>
            <p className="section-hint-light" style={{ margin: "4px 0 0" }}>
              Addressing the operational question: Do prosumers manually upload data every 15 minutes?
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--voltage)", background: "var(--voltage-soft)", padding: "3px 10px", borderRadius: 999 }}>
            Zero Manual Uploads • Autonomous IoT Ingestion
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginTop: 14, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                The Core Answer: Humans Never Manually Upload Data
              </h4>
              <p style={{ fontSize: 12.5, color: "var(--slate)", lineHeight: 1.55, margin: 0 }}>
                In a real-world smart microgrid, <strong>prosumers never log into an app or upload spreadsheets every 15 minutes</strong>. That would be completely impractical. Instead, data acquisition is 100% autonomous, driven by dedicated on-premise hardware collectors running standard industrial energy protocols.
              </p>
            </div>

            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                The Dedicated On-Premise Component: The IoT Edge Microgrid Gateway
              </h4>
              <p style={{ fontSize: 12.5, color: "var(--slate)", lineHeight: 1.55, margin: "0 0 10px" }}>
                Each participant home, commercial facility, or EV hub has a small physical <strong>IoT Edge Microgrid Controller / Smart Inverter Gateway</strong> (e.g., an industrial Raspberry Pi CM4, ESP32-S3 edge node, or inverter dongle) installed alongside their electrical panel:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--slate)", display: "flex", flexDirection: "column", gap: 6 }}>
                <li><strong>Smart Meters (IS 16444 / IS 15959 Indian Standard):</strong> Communicates bidirectional kWh imports and exports via <strong>DLMS / COSEM</strong> over cellular 4G/NB-IoT or RS-485.</li>
                <li><strong>Rooftop Solar Inverters:</strong> Samples instantaneous generation (kW) and MPPT voltage via <strong>Modbus RTU / Modbus TCP</strong> (SunSpec standard across SolarEdge, Sungrow, Enphase, Havells).</li>
                <li><strong>Battery Storage (BESS):</strong> Queries state-of-charge (SOC %), charge limit, and temperature via <strong>CAN bus / RS-485</strong> from the Battery Management System (BMS).</li>
              </ul>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                Automated 15-Minute Telemetry Pipeline
              </h4>
              <p style={{ fontSize: 12.5, color: "var(--slate)", lineHeight: 1.55, margin: "0 0 8px" }}>
                Every 15-minute dispatch interval (96 times daily):
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--slate)", display: "flex", flexDirection: "column", gap: 6 }}>
                <li>The IoT Edge Gateway polls meters and inverters at 15-minute boundary ticks (e.g. 11:00, 11:15, 11:30).</li>
                <li>The telemetry packet (<code>load_kw</code>, <code>gen_kw</code>, <code>battery_soc_pct</code>) is securely encrypted and transmitted to the edge cluster via <strong>MQTT over TLS</strong> or <strong>gRPC</strong>.</li>
                <li>The prosumer&apos;s autonomous trading agent ingests the packet, checks stored user preferences, and formulates market orders in milliseconds.</li>
              </ol>
            </div>

            <div style={{ background: "var(--leaf-soft)", border: "1px solid #BBF7D0", borderRadius: "var(--radius-sm)", padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0C6B3A", marginBottom: 2 }}>
                What Does the Human Prosumer Actually Do?
              </div>
              <p style={{ fontSize: 11.5, color: "#166534", lineHeight: 1.5, margin: 0 }}>
                The prosumer sets their high-level economic policy <strong>once</strong> (e.g. &ldquo;Keep 30% battery reserve; sell surplus when battery exceeds 80%&rdquo;) via their mobile app. Their software agent executes on their behalf 24/7 without requiring manual human clicks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive What-If Decision Sandbox Guide */}
      <div className="card-light">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <div>
            <h3 className="section-title-light" style={{ margin: 0 }}>
              <Icon name="flask" size={16} />
              <span>The What-If Decision Sandbox: Operator Stress-Testing &amp; Policy Audit</span>
            </h3>
            <p className="section-hint-light" style={{ margin: "4px 0 0" }}>
              How evaluators and grid engineers test multi-agent reasoning under boundary conditions without altering the live ledger.
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", background: "#EEF2FF", padding: "3px 10px", borderRadius: 999 }}>
            Stateless Simulator Engine
          </span>
        </div>

        <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.55, margin: "10px 0 16px" }}>
          While live smart meters stream data autonomously in <strong>Mode 1 (Autonomous Empirical Replay)</strong>, the <strong>What-If Sandbox (Mode 2)</strong> provides an interactive testing suite. Evaluators can drag sliders or apply presets to prove that agent decisions branch dynamically in real time:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--leaf)" }}>PRESET 1</span>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>Noon Solar Export</div>
            <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 4 }}>High solar (6.8 kW) + full battery (92%) triggers P2P Ask to sell power to local peers at ₹6.20/kWh.</div>
          </div>

          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D97706" }}>PRESET 2</span>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>Battery Self-Storage</div>
            <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 4 }}>Surplus solar (4.5 kW) with low battery (35% SOC) prioritizes local battery charging over market export.</div>
          </div>

          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--voltage)" }}>PRESET 3</span>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>Evening Deficit</div>
            <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 4 }}>Zero solar + heavy domestic demand (3.6 kW) emits a P2P Buy Bid to save ₹1.60/kWh vs. DISCOM tariff.</div>
          </div>

          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--alert)" }}>PRESET 4</span>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>Feeder Overload (BESS)</div>
            <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 4 }}>Demand surge pushes feeder load above 6.0 kW threshold, triggering an automated BESS peak-shaving override.</div>
          </div>

          <div style={{ padding: "12px 14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--paper)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>PRESET 5</span>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)", marginTop: 2 }}>CERC Price Collar Spike</div>
            <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 4 }}>Setting price to ₹11.50/kWh triggers the CERC Regulatory Guard (Rule R-01), auto-voiding the rogue trade.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
