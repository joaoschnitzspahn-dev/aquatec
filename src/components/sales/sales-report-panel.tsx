"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type Report = {
  range: string;
  count: number;
  total: number;
  byClient: { name: string; total: number; count: number }[];
  byProduct: { name: string; quantity: number; total: number }[];
  byMonth: { month: string; value: number }[];
};

export function SalesReportPanel({
  month,
  year,
  all,
  active,
}: {
  month: Report;
  year: Report;
  all: Report;
  active: "month" | "year" | "all";
}) {
  const router = useRouter();
  const data = active === "month" ? month : active === "year" ? year : all;

  function setRange(next: "month" | "year" | "all") {
    router.push(`/reports?range=${next}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ["month", "Mensal"],
            ["year", "Anual"],
            ["all", "Geral"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              active === key
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">Cobranças</p>
          <p className="mt-1 text-2xl font-semibold">{data.count}</p>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">Faturamento</p>
          <p className="mt-1 text-xl font-semibold text-[var(--brand)]">
            {formatCurrency(data.total)}
          </p>
        </div>
      </div>

      {data.byMonth.length > 0 ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="mb-3 text-sm font-semibold">Por período</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v || 0))}
                />
                <Bar dataKey="value" fill="var(--brand)" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-3 text-sm font-semibold">Por cliente</p>
        <div className="space-y-2">
          {data.byClient.slice(0, 8).map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {c.count} cobrança{c.count !== 1 ? "s" : ""}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(c.total)}</p>
            </div>
          ))}
          {data.byClient.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sem vendas no período.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-3 text-sm font-semibold">Por produto</p>
        <div className="space-y-2">
          {data.byProduct.slice(0, 8).map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  Qtd {p.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(p.total)}</p>
            </div>
          ))}
          {data.byProduct.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sem itens no período.</p>
          ) : null}
        </div>
      </div>

      <Link
        href="/sales"
        className="relative z-10 block text-center text-sm text-[var(--brand)]"
      >
        Gerar nova cobrança →
      </Link>
    </div>
  );
}
