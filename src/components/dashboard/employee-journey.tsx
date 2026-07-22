"use client";

import { useEffect, useRef, useState } from "react";
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

const HOLD_MS = 3000;

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

function HoldToStartButton({
  disabled,
  onComplete,
}: {
  disabled?: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startAtRef = useRef(0);
  const doneRef = useRef(false);

  function clearHold() {
    if (doneRef.current) return;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startAtRef.current = 0;
    setHolding(false);
    setProgress(0);
  }

  function beginHold() {
    if (disabled) return;
    doneRef.current = false;
    setHolding(true);
    startAtRef.current = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - startAtRef.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        if (!doneRef.current) {
          doneRef.current = true;
          setHolding(false);
          setProgress(1);
          onComplete();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      className="relative mt-5 flex h-14 w-full select-none items-center justify-center overflow-hidden rounded-2xl border border-[var(--brand)]/40 bg-[var(--surface)] text-base font-semibold text-[var(--foreground)] shadow-lg shadow-[var(--brand-soft)] transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 touch-none"
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        beginHold();
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={() => {
        if (holding) clearHold();
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-[var(--brand)] transition-[width] duration-75 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
      <span
        className={`relative z-10 flex items-center gap-2 ${
          progress > 0.45 ? "text-white" : "text-[var(--foreground)]"
        }`}
      >
        <Play className="h-5 w-5" />
        Aperte e segure para iniciar
      </span>
    </button>
  );
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
    try {
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
    } catch {
      toast.error("Não foi possível iniciar a jornada. Tente de novo.");
    } finally {
      setStarting(false);
    }
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
            Segure o botão por 3 segundos para capturar o GPS e montar a rota
            do dia com os clientes designados a você.
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

          <HoldToStartButton
            disabled={starting}
            onComplete={() => void startJourney()}
          />
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            Solte antes dos 3s para cancelar
          </p>
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
