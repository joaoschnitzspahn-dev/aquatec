"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ReportsCharts({
  weekly,
  products,
}: {
  weekly: { day: string; count: number }[];
  products: { name: string; quantity: number }[];
}) {
  return (
    <div className="space-y-4">
      <div className="h-52 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Semanal
        </p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} />
            <YAxis stroke="var(--muted)" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
            <Bar dataKey="count" fill="var(--brand)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-52 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Produtos mais usados
        </p>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={products.slice(0, 6)}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} hide />
            <YAxis stroke="var(--muted)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
            <Bar dataKey="quantity" fill="var(--success)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
