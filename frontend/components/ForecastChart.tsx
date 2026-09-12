"use client";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function ForecastChart({ forecasts }: { forecasts: any[] }) {
  const data = (forecasts ?? []).map((f: any) => ({
    name: f.participant_id,
    load: f.predicted_load_kw,
    gen: f.predicted_gen_kw,
  }));
  return (
    <div>
      <h3>Forecasts</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="load" dot={false} />
          <Line dataKey="gen" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
