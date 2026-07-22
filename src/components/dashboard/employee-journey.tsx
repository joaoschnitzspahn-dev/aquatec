"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Play, Square, Users } from "lucide-react";
import { toast } from "sonner";
import {
  TodayQueue,
  type TodayAppointmentItem,
  clearJourneyOrigin,
  updateJourneyOrigin,
} from "@/components/dashboard/today-queue";
import { Badge, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { getQuickGeo, warmGps } from "@/lib/geo";

export type AssignedClient = {
  id: string;
  name: string;
  address: string;
  city?: string;
  serviceTime?: string;
};

function startedKey() {
  return `aquatec_journey_started_${new Date().toISOString().slice(0, 10)}`;
}

function readStarted(): boolean {
  try {
    return sessionStorage.getItem(startedKey()) === "1";
  } catch {
    return false;
  }
}

function writeStarted() {
  try {
    sessionStorage.setItem(startedKey(), "1");
  } catch {
    /* ignore */
  }
}

function clearStarted() {
  try {
    sessionStorage.removeItem(startedKey());
  } catch {
    /* ignore */
  }
}

export function EmployeeJourney({
  employeeName,
  appointments,
  completed,
  assignedClients,
  lastKnown,
}: {
  employeeName: string;
  appointments: TodayAppointmentItem[];
  completed: TodayAppointmentItem[];
  assignedClients: AssignedClient[];
  lastKnown?: { lat: number; lng: number } | null;
}) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    warmGps();
    setStarted(readStarted());
    setReady(true);
  }, []);

  async function startJourney() {
    setStarting(true);
    toast.message("Obtendo sua localização…");
    const geo = await getQuickGeo({ force: true });
    if (geo) {
      updateJourneyOrigin(geo.latitude, geo.longitude);
      toast.success("Jornada iniciada — rota pelo mais próximo");
    } else if (lastKnown) {
      updateJourneyOrigin(lastKnown.lat, lastKnown.lng);
      toast.warning("GPS indisponível — usando última posição conhecida");
    } else {
      toast.warning("Sem GPS — rota por horário. Ative a localização.");
    }
    writeStarted();
    setStarted(true);
    setStarting(false);
  }

  function stopJourney() {
    clearStarted();
    clearJourneyOrigin();
    setStarted(false);
    toast.message("Jornada encerrada. Pode iniciar de novo quando quiser.");
  }

  if (!ready) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted)]">
        Preparando o dia…
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl border border-[var(--brand)]/35 bg-[var(--brand-soft)] p-5">
          <p className="text-sm text-[var(--brand)]">Bom dia, {employeeName}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Pronto para a rota?
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ao iniciar a jornada, o app captura seu GPS e monta a rota do dia
            com os clientes designados a você.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Na rota hoje</p>
              <p className="mt-1 text-2xl font-semibold">
                {appointments.length + completed.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Clientes seus</p>
              <p className="mt-1 text-2xl font-semibold">
                {assignedClients.length}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            disabled={starting}
            onClick={() => void startJourney()}
          >
            <Play className="h-5 w-5" />
            {starting ? "Iniciando…" : "Iniciar jornada"}
          </Button>
        </div>

        <Section title="Prévia dos clientes designados">
          <div className="space-y-2">
            {assignedClients.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
              >
                <p className="font-medium">{c.name}</p>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--muted)]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {c.address}
                  {c.city ? ` — ${c.city}` : ""}
                </p>
              </div>
            ))}
            {assignedClients.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Nenhum cliente designado a você ainda.
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            A rota detalhada e o mapa liberam depois de iniciar a jornada.
          </p>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
          <Navigation className="h-4 w-4" />
          Jornada em andamento
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={stopJourney}
        >
          <Square className="h-3.5 w-3.5" />
          Encerrar
        </Button>
      </div>

      <Section
        title="Clientes designados"
        action={
          <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
            <Users className="h-3.5 w-3.5" />
            {assignedClients.length}
          </span>
        }
      >
        <div className="space-y-2">
          {assignedClients.map((c) => {
            const onRoute = appointments.some((a) => a.client.id === c.id);
            const done = completed.some((a) => a.client.id === c.id);
            return (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="relative z-10 block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition hover:border-[var(--brand)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {c.address}
                      {c.city ? ` — ${c.city}` : ""}
                    </p>
                    {c.serviceTime ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Horário usual {c.serviceTime}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    tone={done ? "success" : onRoute ? "brand" : "default"}
                  >
                    {done ? "Feito" : onRoute ? "Na rota" : "Carteira"}
                  </Badge>
                </div>
              </Link>
            );
          })}
          {assignedClients.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Nenhum cliente designado.
            </p>
          ) : null}
        </div>
      </Section>

      <TodayQueue
        appointments={appointments}
        completed={completed}
        lastKnown={lastKnown}
        autoLocate
      />
    </div>
  );
}
