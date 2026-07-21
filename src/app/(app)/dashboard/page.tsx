import Link from "next/link";
import { ArrowRight, Clock3, MapPin, AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState, Section, StatPill } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import {
  getDashboardData,
  listAppointments,
  listNotifications,
} from "@/lib/data/actions";
import { STATUS_LABELS } from "@/lib/data/types";
import { formatCurrency, formatTime, minutesToLabel, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const todayAppointments = await listAppointments("today");
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

        {data.next ? (
          <Section title="Próximo cliente">
            <Link
              href={`/visits/start/${data.next.id}`}
              className="relative z-10 block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand)]/40 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{data.next.client.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                    <Clock3 className="h-4 w-4" />
                    {formatTime(data.next.scheduledAt)}
                  </p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--muted)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {data.next.client.address}
                  </p>
                </div>
                <Badge tone="brand">Abrir</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-[var(--brand)]">
                Iniciar atendimento
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </Section>
        ) : null}

        <Section title="Agendamentos de hoje">
          <div className="space-y-2">
            {todayAppointments.map((a) => (
              <Link
                key={a.id}
                href={a.visit ? `/visits/${a.visit.id}` : `/visits/start/${a.id}`}
                className="relative z-10 block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand)]/40 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.client.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatDateTime(a.scheduledAt)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {a.client.address}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--brand)]">
                      Toque para abrir →
                    </p>
                  </div>
                  <Badge tone="brand">{STATUS_LABELS[a.status]}</Badge>
                </div>
              </Link>
            ))}
            {todayAppointments.length === 0 ? (
              <EmptyState title="Nenhum atendimento hoje" />
            ) : null}
          </div>
        </Section>

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
