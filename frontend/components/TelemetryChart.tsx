"use client";
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type { TickPoint } from "../hooks/useGridStream";
import { parseSimTime } from "../lib/utils";

Chart.register(...registerables);

export function TelemetryChart({ history }: { history: TickPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: history.map((p) => parseSimTime(p.tick).chartLabel),
        datasets: [
          { label: "Solar Gen (kW)", data: history.map((p) => p.solarKw), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.08)", fill: true, tension: 0.35, pointRadius: 2 },
          { label: "Feeder Load (kW)", data: history.map((p) => p.loadKw), borderColor: "#0284c7", backgroundColor: "transparent", tension: 0.35, pointRadius: 2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 9 } } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [history]);

  return <canvas ref={canvasRef} />;
}

export default TelemetryChart;
