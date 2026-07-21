"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, MapPin, Navigation } from "lucide-react";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/dashboard/route-map";
import { STATUS_LABELS, type AppointmentStatus } from "@/lib/data/types";
import { getQuickGeo, orderByNearestNeighbor, warmGps } from "@/lib/geo";
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

function visitHref(a: TodayAppointmentItem) {
  if (a.visit?.status === "STARTED" || a.visit?.status === "COMPLETED") {
    return `/visits/${a.visit.id}`;
  }
  return `/visits/start/${a.id}`;
}

export function TodayQueue({
  appointments,
  completed,
  lastKnown,
}: {
  appointments: TodayAppointmentItem[];
  completed: TodayAppointmentItem[];
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
        setGpsHint("Rota pelo mais próximo da sua posição.");
        return;
      }
    }

    const geo = await getQuickGeo({ force });
    if (geo) {
      writeStoredOrigin(geo.latitude, geo.longitude);
      setOrigin({
        lat: geo.latitude,
        lng: geo.longitude,
        source: "gps",
      });
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
    warmGps();
    void captureOrigin(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ranked = useMemo(() => {
    if (origin.source === "none") {
      return [...appointments].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    }

    const ordered = orderByNearestNeighbor(
      { lat: origin.lat, lng: origin.lng },
      appointments.map((a) => ({
        ...a,
        latitude: a.client.latitude,
        longitude: a.client.longitude,
      })),
    );

    return ordered.map((a) => {
      const meters =
        a.client.latitude != null && a.client.longitude != null
          ? distanceMeters(
              origin.lat,
              origin.lng,
              a.client.latitude,
              a.client.longitude,
            )
          : null;
      return { ...a, meters };
    });
  }, [appointments, origin]);

  const next = ranked[0] ?? null;

  const routeStops = ranked
    .filter((a) => a.client.latitude != null && a.client.longitude != null)
    .map((a) => ({
      id: a.id,
      name: a.client.name,
      lat: a.client.latitude!,
      lng: a.client.longitude!,
    }));

  const doneStops = completed
    .filter((a) => a.client.latitude != null && a.client.longitude != null)
    .map((a) => ({
      id: a.id,
      name: a.client.name,
      lat: a.client.latitude!,
      lng: a.client.longitude!,
      done: true as const,
    }));

  const mapOrigin =
    origin.source !== "none" ? { lat: origin.lat, lng: origin.lng } : null;

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

      <RouteMap
        origin={mapOrigin}
        routeStops={routeStops}
        doneStops={doneStops}
      />

      {next ? (
        <Section title="Próximo cliente">
          <Link
            href={visitHref(next)}
            className="relative z-10 block rounded-3xl border border-[var(--brand)]/40 bg-[var(--brand-soft)] p-4 transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{next.client.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <Clock3 className="h-4 w-4" />
                  {formatTime(next.scheduledAt)}
                  {"meters" in next && next.meters != null ? (
                    <span className="text-[var(--brand)]">
                      · {formatDistance(next.meters as number)}
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

      <Section title="Rota de hoje">
        <div className="space-y-2">
          {ranked.map((a, index) => (
            <Link
              key={a.id}
              href={visitHref(a)}
              className="relative z-10 block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand)]/40 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] text-white">
                      {index + 1}
                    </span>
                    {a.client.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatDateTime(a.scheduledAt)}
                    {"meters" in a && a.meters != null ? (
                      <span className="text-[var(--brand)]">
                        {" "}
                        · {formatDistance(a.meters as number)}
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
            <EmptyState title="Nenhum atendimento na rota" />
          ) : null}
        </div>
      </Section>

      {completed.length > 0 ? (
        <Section title="Finalizados">
          <div className="space-y-2">
            {completed.map((a) => (
              <Link
                key={a.id}
                href={visitHref(a)}
                className="relative z-10 block rounded-3xl border border-emerald-500/35 bg-emerald-500/10 p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      {a.client.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatDateTime(a.scheduledAt)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {a.client.address}
                    </p>
                    <p className="mt-2 text-xs font-medium text-emerald-400">
                      Fora da rota · ver resumo →
                    </p>
                  </div>
                  <Badge tone="success">Concluído</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

/** Após concluir visita, atualiza a origem da jornada para a posição atual. */
export function updateJourneyOrigin(lat: number, lng: number) {
  writeStoredOrigin(lat, lng);
  try {
    sessionStorage.setItem(
      "aquatec_geo_cache",
      JSON.stringify({ latitude: lat, longitude: lng, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}
