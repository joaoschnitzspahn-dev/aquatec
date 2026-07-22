import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, Section, StatPill } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmployeeJourney } from "@/components/dashboard/employee-journey";
import { MasterLiveBoard } from "@/components/dashboard/master-live-board";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { getDashboardData, listNotifications } from "@/lib/data/actions";
import { formatCurrency, minutesToLabel } from "@/lib/utils";

function mapAppt(
  a: Awaited<ReturnType<typeof getDashboardData>>["pendingAppointments"][number],
) {
  return {
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
    visit: a.visit ? { id: a.visit.id, status: a.visit.status } : null,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  const isEmployee = data.user.role === "EMPLOYEE";

  return (
    <>
      <TopBar title="Hoje" unread={unread} />
      <div className="relative z-0 space-y-5 animate-fade-up">
        {!isEmployee ? (
          <div>
            <p className="text-sm text-[var(--muted)]">
              Olá, {data.user.name.split(" ")[0]}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Operação da equipe
            </h2>
          </div>
        ) : null}

        {!isEmployee && data.master ? (
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Em rota" value={data.master.onRoute} />
            <StatPill label="Online" value={data.master.online} />
            <StatPill label="Pendentes" value={data.pending} hint="hoje" />
            <StatPill
              label="Concluídos"
              value={data.master.completedToday}
              hint="hoje"
            />
          </div>
        ) : null}

        {isEmployee ? (
          <EmployeeJourney
            employeeName={data.user.name.split(" ")[0]}
            appointments={data.pendingAppointments.map(mapAppt)}
            completed={data.completedAppointments.map(mapAppt)}
            assignedClients={data.assignedClients}
            lastKnown={data.lastKnown}
          />
        ) : (
          <MasterLiveBoard employees={data.liveEmployees} />
        )}

        <DashboardAlerts
          alerts={data.alerts.map((a) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            link: a.link,
            read: a.read,
          }))}
        />

        {data.master ? (
          <Section title="Resumo do dia">
            <div className="grid grid-cols-2 gap-3">
              <StatPill label="Clientes" value={data.master.clients} />
              <StatPill
                label="Tempo médio"
                value={minutesToLabel(data.avgTime || 0)}
              />
              <StatPill label="Estoque baixo" value={data.master.lowStock} />
              <StatPill
                label="Faturamento"
                value={formatCurrency(data.master.revenue)}
              />
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

        <Button
          asChild
          className="relative z-10 w-full"
          size="lg"
          variant="outline"
        >
          <Link href="/schedule">Ver agenda completa</Link>
        </Button>
      </div>
    </>
  );
}
