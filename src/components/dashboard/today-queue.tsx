"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Navigation } from "lucide-react";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type AppointmentStatus } from "@/lib/data/types";
import {
  distanceMeters,
  formatDateTime,
  formatDistance,
  formatTime,
} from "@/lib/utils";

export type TodayAppointmentItem = {
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  client: {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  visit?: { id: string; status: string } | null;
};

type Origin = { lat: number; lng: number; source: "gps" | "last" | "none" };

function journeyKey() {
  return `aquatec_journey_${new Date().toISOString().slice(0, 10)}`;
}

function readStoredOrigin(): Origin | null {
  try {
    const raw = sessionStorage.getItem(journeyKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat: number; lng: number };
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      !Number.isNaN(parsed.lat) &&
      !Number.isNaN(parsed.lng)
    ) {
      return { lat: parsed.lat, lng: parsed.lng, source: "last" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredOrigin(lat: number, lng: number) {
  try {
    sessionStorage.setItem(journeyKey(), JSON.stringify({ lat, lng }));
  } catch {
    /* ignore */
  }
}

function getGeo(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}

export function TodayQueue({
  appointments,
  lastKnown,
}: {
  appointments: TodayAppointmentItem[];
  lastKnown?: { lat: number; lng: number } | null;
}) {
  const [origin, setOrigin] = useState<Origin>(() =>
    lastKnown
      ? { lat: lastKnown.lat, lng: lastKnown.lng, source: "last" }
      : { lat: 0, lng: 0, source: "none" },
  );
  const [locating, setLocating] = useState(false);
  const [gpsHint, setGpsHint] = useState<string | null>(null);

  async function captureOrigin(force = false) {
    setLocating(true);
    setGpsHint(null);

    if (!force) {
      const stored = readStoredOrigin();
      if (stored) {
        setOrigin(stored);
        setLocating(false);
        return;
      }
    }

    const geo = await getGeo();
    if (geo.lat != null && geo.lng != null) {
      writeStoredOrigin(geo.lat, geo.lng);
      setOrigin({ lat: geo.lat, lng: geo.lng, source: "gps" });
      setGpsHint("Rota pelo mais próximo da sua localização.");
    } else if (lastKnown) {
      setOrigin({ ...lastKnown, source: "last" });
      setGpsHint("Usando a última posição do atendimento anterior.");
    } else {
      setOrigin({ lat: 0, lng: 0, source: "none" });
      setGpsHint("Sem GPS — ordem por horário. Ative a localização.");
    }
    setLocating(false);
  }

  useEffect(() => {
    void captureOrigin(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ranked = useMemo(() => {
    const withDistance = appointments.map((a) => {
      let meters: number | null = null;
      if (
        origin.source !== "none" &&
        a.client.latitude != null &&
        a.client.longitude != null
      ) {
        meters = distanceMeters(
          origin.lat,
          origin.lng,
          a.client.latitude,
          a.client.longitude,
        );
      }
      return { ...a, meters };
    });

    return withDistance.sort((a, b) => {
      if (a.meters != null && b.meters != null) return a.meters - b.meters;
      if (a.meters != null) return -1;
      if (b.meters != null) return 1;
      return (
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    });
  }, [appointments, origin]);

  const next = ranked[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Jornada de hoje</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {gpsHint ||
                (origin.source === "none"
                  ? "Capture a localização para priorizar o cliente mais perto."
                  : "Próximo cliente = mais próximo da sua posição.")}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={locating}
            onClick={() => void captureOrigin(true)}
          >
            <Navigation className="mr-1.5 h-3.5 w-3.5" />
            {locating ? "…" : "Atualizar"}
          </Button>
        </div>
      </div>

      {next ? (
        <Section title="Próximo cliente">
          <Link
            href={
              next.visit?.status === "STARTED" || next.visit?.status === "COMPLETED"
                ? `/visits/${next.visit.id}`
                : `/visits/start/${next.id}`
            }
            className="relative z-10 block rounded-3xl border border-[var(--brand)]/40 bg-[var(--brand-soft)] p-4 transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{next.client.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <Clock3 className="h-4 w-4" />
                  {formatTime(next.scheduledAt)}
                  {next.meters != null ? (
                    <span className="text-[var(--brand)]">
                      · {formatDistance(next.meters)}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-[var(--muted)]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {next.client.address}
                </p>
              </div>
              <Badge tone="brand">Abrir</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-[var(--brand)]">
              {next.status === "IN_PROGRESS"
                ? "Continuar atendimento"
                : "Iniciar atendimento"}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </Section>
      ) : null}

      <Section title="Agendamentos de hoje">
        <div className="space-y-2">
          {ranked.map((a) => (
            <Link
              key={a.id}
              href={
                a.visit?.status === "STARTED" || a.visit?.status === "COMPLETED"
                  ? `/visits/${a.visit.id}`
                  : `/visits/start/${a.id}`
              }
              className="relative z-10 block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand)]/40 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.client.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatDateTime(a.scheduledAt)}
                    {a.meters != null ? (
                      <span className="text-[var(--brand)]">
                        {" "}
                        · {formatDistance(a.meters)}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {a.client.address}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[var(--brand)]">
                    Toque para abrir →
                  </p>
                </div>
                <Badge tone={a.status === "IN_PROGRESS" ? "warning" : "brand"}>
                  {STATUS_LABELS[a.status]}
                </Badge>
              </div>
            </Link>
          ))}
          {ranked.length === 0 ? (
            <EmptyState title="Nenhum atendimento pendente hoje" />
          ) : null}
        </div>
      </Section>
    </div>
  );
}

/** Após concluir visita, atualiza a origem da jornada para a posição atual. */
export function updateJourneyOrigin(lat: number, lng: number) {
  writeStoredOrigin(lat, lng);
}
