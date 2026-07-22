import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Navigation,
  Route,
  UserRound,
} from "lucide-react";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export type LiveEmployee = {
  id: string;
  name: string;
  isOnline: boolean;
  phase: "at_client" | "traveling" | "idle" | "done" | "off";
  focusClient: { id: string; name: string; address: string } | null;
  pendingCount: number;
  doneCount: number;
  totalToday: number;
  activeVisitId: string | null;
  nextAppointmentId: string | null;
};

const PHASE_LABEL: Record<LiveEmployee["phase"], string> = {
  at_client: "No cliente",
  traveling: "A caminho",
  idle: "Disponível",
  done: "Rota concluída",
  off: "Sem rota",
};

const PHASE_TONE: Record<
  LiveEmployee["phase"],
  "success" | "brand" | "warning" | "default"
> = {
  at_client: "success",
  traveling: "brand",
  idle: "warning",
  done: "default",
  off: "default",
};

export function MasterLiveBoard({ employees }: { employees: LiveEmployee[] }) {
  const onRoute = employees.filter(
    (e) => e.phase === "at_client" || e.phase === "traveling",
  );

  return (
    <div className="space-y-5">
      <Section
        title="Equipe em campo"
        action={
          <span className="text-xs text-[var(--muted)]">
            {onRoute.length} em rota
          </span>
        }
      >
        <div className="space-y-2">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserRound className="h-4 w-4 text-[var(--brand)]" />
                    <p className="font-semibold">{emp.name}</p>
                    <Badge tone={emp.isOnline ? "success" : "default"}>
                      {emp.isOnline ? "Online" : "Offline"}
                    </Badge>
                    <Badge tone={PHASE_TONE[emp.phase]}>
                      {PHASE_LABEL[emp.phase]}
                    </Badge>
                  </div>

                  {emp.focusClient ? (
                    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand)]">
                        {emp.phase === "at_client" ? (
                          <>
                            <MapPin className="h-3.5 w-3.5" />
                            Atendendo agora
                          </>
                        ) : (
                          <>
                            <Navigation className="h-3.5 w-3.5" />
                            Indo para
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {emp.focusClient.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {emp.focusClient.address}
                      </p>
                      {emp.phase === "at_client" && emp.activeVisitId ? (
                        <Link
                          href={`/visits/${emp.activeVisitId}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)]"
                        >
                          Abrir atendimento <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {emp.phase === "done"
                        ? "Todos os atendimentos de hoje finalizados."
                        : "Sem cliente em foco no momento."}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Hoje: {emp.doneCount}/{emp.totalToday} concluídos
                    {emp.pendingCount > 0
                      ? ` · ${emp.pendingCount} pendente${emp.pendingCount > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="relative z-10 mt-3 w-full"
              >
                <Link href={`/employees/${emp.id}/route`}>
                  <Route className="h-4 w-4" />
                  Ver rota detalhada
                </Link>
              </Button>
            </div>
          ))}
          {employees.length === 0 ? (
            <EmptyState title="Nenhum funcionário cadastrado" />
          ) : null}
        </div>
      </Section>
    </div>
  );
}
