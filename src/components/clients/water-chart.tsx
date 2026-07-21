"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function WaterChart({
  data,
}: {
  data: { date: string; ph?: number; chlorine?: number }[];
}) {
  return (
    <div className="h-56 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
          <YAxis stroke="var(--muted)" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="ph"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="chlorine"
            stroke="var(--success)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
