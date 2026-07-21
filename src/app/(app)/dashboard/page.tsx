import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, Section, StatPill } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { TodayQueue } from "@/components/dashboard/today-queue";
import { getDashboardData, listNotifications } from "@/lib/data/actions";
import { formatCurrency, formatTime, minutesToLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Hoje" unread={unread} />
      <div className="relative z-0 space-y-5 animate-fade-up">
        <div>
          <p className="text-sm text-[var(--muted)]">
            Olá, {data.user.name.split(" ")[0]}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Sua operação em dia
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatPill label="Atendimentos" value={data.todayCount} hint="hoje" />
          <StatPill label="Pendentes" value={data.pending} />
          <StatPill
            label="Tempo médio"
            value={minutesToLabel(data.avgTime || 0)}
          />
          <StatPill
            label="Próximo"
            value={data.next ? formatTime(data.next.scheduledAt) : "—"}
            hint={data.next?.client.name}
          />
        </div>

        <TodayQueue
          appointments={data.pendingAppointments.map((a) => ({
            id: a.id,
            scheduledAt: a.scheduledAt,
            status: a.status,
            client: {
              id: a.client.id,
              name: a.client.name,
              address: a.client.address,
              latitude: a.client.latitude,
              longitude: a.client.longitude,
            },
            visit: a.visit
              ? { id: a.visit.id, status: a.visit.status }
              : null,
          }))}
          lastKnown={data.lastKnown}
        />

        {data.alerts.length > 0 ? (
          <Section
            title="Avisos"
            action={
              <Link
                href="/notifications"
                className="relative z-10 text-xs text-[var(--brand)]"
              >
                Ver todos
              </Link>
            }
          >
            <div className="space-y-2">
              {data.alerts.map((a) => (
                <Link
                  key={a.id}
                  href={a.link || "/notifications"}
                  className="relative z-10 flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-[var(--muted)]">{a.message}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        ) : null}

        {data.master ? (
          <Section title="Visão Master">
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Clientes" value={data.master.clients} />
              <StatPill label="Online" value={data.master.online} />
              <StatPill label="Estoque baixo" value={data.master.lowStock} />
              <StatPill
                label="Concluídos"
                value={data.master.completedToday}
                hint="hoje"
              />
              <div className="col-span-2">
                <StatPill
                  label="Faturamento hoje"
                  value={formatCurrency(data.master.revenue)}
                />
              </div>
            </div>
            {data.master.lowStockProducts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {data.master.lowStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    href="/stock"
                    className="relative z-10 flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm"
                  >
                    <span>{p.name}</span>
                    <Badge tone="danger">
                      {p.quantity} {p.unit}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </Section>
        ) : null}

        <Button asChild className="relative z-10 w-full" size="lg">
          <Link href="/schedule">Ver agenda completa</Link>
        </Button>
      </div>
    </>
  );
}
