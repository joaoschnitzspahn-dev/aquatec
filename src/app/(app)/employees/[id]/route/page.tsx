import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/misc";
import { TodayQueue } from "@/components/dashboard/today-queue";
import {
  getEmployeeTodayRoute,
  listNotifications,
} from "@/lib/data/actions";

export default async function EmployeeRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getEmployeeTodayRoute(id);
  } catch {
    notFound();
  }

  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  const { employee, pending, completed, lastKnown } = data;

  return (
    <>
      <TopBar title={`Rota · ${employee.name.split(" ")[0]}`} unread={unread} />
      <div className="space-y-5 animate-fade-up">
        <Link
          href="/dashboard"
          className="relative z-10 inline-flex items-center gap-1.5 text-sm text-[var(--brand)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{employee.name}</p>
            <Badge tone={employee.isOnline ? "success" : "default"}>
              {employee.isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Rota detalhada de hoje · {pending.length} pendente
            {pending.length !== 1 ? "s" : ""} · {completed.length} concluído
            {completed.length !== 1 ? "s" : ""}
          </p>
        </div>

        <TodayQueue
          appointments={pending.map((a) => ({
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
          completed={completed.map((a) => ({
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
          lastKnown={lastKnown}
          autoLocate={Boolean(lastKnown)}
        />
      </div>
    </>
  );
}
