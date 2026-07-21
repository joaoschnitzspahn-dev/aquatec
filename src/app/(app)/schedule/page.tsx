import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import {
  listAppointments,
  listNotifications,
  getClientsForSelect,
  getEmployeesForSelect,
} from "@/lib/data/actions";
import { STATUS_LABELS } from "@/lib/data/types";
import { formatDateTime } from "@/lib/utils";
import { AppointmentForm } from "@/components/visit/appointment-form";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range =
    rangeParam === "week" || rangeParam === "month" ? rangeParam : "today";
  const appointments = await listAppointments(range);
  const clients = await getClientsForSelect();
  const employees = await getEmployeesForSelect();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Agenda" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <div className="flex gap-2">
          {(
            [
              ["today", "Hoje"],
              ["week", "Semana"],
              ["month", "Mês"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              asChild
              size="sm"
              variant={range === key ? "default" : "secondary"}
            >
              <Link href={`/schedule?range=${key}`}>{label}</Link>
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {appointments.map((a) => (
            <Link
              key={a.id}
              href={
                a.visit
                  ? `/visits/${a.visit.id}`
                  : `/visits/start/${a.id}`
              }
              className="block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition active:scale-[0.99]"
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
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {a.employee.name}
                  </p>
                </div>
                <Badge
                  tone={
                    a.status === "COMPLETED"
                      ? "success"
                      : a.status === "LATE"
                        ? "danger"
                        : "brand"
                  }
                >
                  {STATUS_LABELS[a.status]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>

        <AppointmentForm clients={clients} employees={employees} />
      </div>
    </>
  );
}
