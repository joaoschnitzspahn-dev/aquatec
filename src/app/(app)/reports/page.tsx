import { TopBar } from "@/components/layout/top-bar";
import { Section, StatPill } from "@/components/ui/misc";
import {
  getReports,
  getSalesReport,
  listNotifications,
} from "@/lib/data/actions";
import { formatCurrency, minutesToLabel } from "@/lib/utils";
import { ReportsCharts } from "@/components/visit/reports-charts";
import { SalesReportPanel } from "@/components/sales/sales-report-panel";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range =
    sp.range === "year" || sp.range === "all" ? sp.range : "month";

  const data = await getReports();
  const [month, year, all] = await Promise.all([
    getSalesReport("month"),
    getSalesReport("year"),
    getSalesReport("all"),
  ]);
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Relatórios" unread={unread} />
      <div className="space-y-5 animate-fade-up">
        <Section title="Financeiro (vendas / cobranças)">
          <SalesReportPanel
            month={month}
            year={year}
            all={all}
            active={range}
          />
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <StatPill label="Visitas" value={data.totalVisits} />
          <StatPill label="Faturamento" value={formatCurrency(data.revenue)} />
        </div>

        <Section title="Produtividade por funcionário">
          <div className="space-y-2">
            {data.byEmployee.map((e) => (
              <div
                key={e.name}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Tempo médio {minutesToLabel(e.avgTime)}
                  </p>
                </div>
                <p className="font-semibold">{e.visits}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Operação">
          <ReportsCharts weekly={data.weekly} products={data.productUsage} />
        </Section>
      </div>
    </>
  );
}
