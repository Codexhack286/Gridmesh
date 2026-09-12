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
    </div>
  );
}
