import { TopBar } from "@/components/layout/top-bar";
import { Section, StatPill } from "@/components/ui/misc";
import { getReports, listNotifications } from "@/lib/data/actions";
import { formatCurrency, minutesToLabel } from "@/lib/utils";
import { ReportsCharts } from "@/components/visit/reports-charts";

export default async function ReportsPage() {
  const data = await getReports();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Relatórios" unread={unread} />
      <div className="space-y-4 animate-fade-up">
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

        <Section title="Gráficos">
          <ReportsCharts weekly={data.weekly} products={data.productUsage} />
        </Section>
      </div>
    </>
  );
}
