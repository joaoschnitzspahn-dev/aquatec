"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export type MapStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  done?: boolean;
};

type Props = {
  origin?: { lat: number; lng: number } | null;
  routeStops: MapStop[];
  doneStops: MapStop[];
};

async function fetchOsrmGeometry(
  points: { lat: number; lng: number }[],
): Promise<[number, number][] | null> {
  if (points.length < 2) return null;
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[];
    };
    const line = data.routes?.[0]?.geometry?.coordinates;
    if (!line?.length) return null;
    return line.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
}

function stopsKey(stops: MapStop[]) {
  return stops
    .map((s) => `${s.id}:${s.lat.toFixed(5)},${s.lng.toFixed(5)}`)
    .join("|");
}

export function RouteMap({ origin, routeStops, doneStops }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);
  const [status, setStatus] = useState("Carregando mapa…");

  const originKey = origin
    ? `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`
    : "";
  const routeKey = stopsKey(routeStops);
  const doneKey = stopsKey(doneStops);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([-23.55, -46.63], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);

        L.control.zoom({ position: "topright" }).addTo(mapRef.current);
        layersRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const map = mapRef.current;
      const layers = layersRef.current!;
      layers.clearLayers();

      const bounds: [number, number][] = [];

      const youIcon = L.divIcon({
        className: "aquatec-map-pin",
        html: `<div style="width:14px;height:14px;border-radius:999px;background:#2f6fed;border:2px solid #fff;box-shadow:0 0 0 2px #2f6fed88"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const stopIcon = (n: number) =>
        L.divIcon({
          className: "aquatec-map-pin",
          html: `<div style="min-width:22px;height:22px;padding:0 5px;border-radius:999px;background:#2f6fed;color:#fff;font:700 11px/22px system-ui;text-align:center;border:2px solid #fff">${n}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
      const doneIcon = L.divIcon({
        className: "aquatec-map-pin",
        html: `<div style="width:18px;height:18px;border-radius:999px;background:#16a34a;border:2px solid #fff;box-shadow:0 0 0 2px #16a34a55"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (origin) {
        L.marker([origin.lat, origin.lng], { icon: youIcon })
          .bindPopup("Você")
          .addTo(layers);
        bounds.push([origin.lat, origin.lng]);
      }

      routeStops.forEach((s, i) => {
        L.marker([s.lat, s.lng], { icon: stopIcon(i + 1) })
          .bindPopup(s.name)
          .addTo(layers);
        bounds.push([s.lat, s.lng]);
      });

      doneStops.forEach((s) => {
        L.marker([s.lat, s.lng], { icon: doneIcon })
          .bindPopup(`${s.name} · concluído`)
          .addTo(layers);
        // Não entra nos bounds da rota ativa — só referência visual
      });

      const pathPoints: { lat: number; lng: number }[] = [];
      if (origin) pathPoints.push(origin);
      routeStops.forEach((s) => pathPoints.push({ lat: s.lat, lng: s.lng }));

      if (pathPoints.length >= 2) {
        setStatus("Traçando rota…");
        const geometry = await fetchOsrmGeometry(pathPoints);
        if (cancelled) return;
        if (geometry) {
          L.polyline(geometry, {
            color: "#2f6fed",
            weight: 5,
            opacity: 0.9,
          }).addTo(layers);
          setStatus(
            doneStops.length > 0
              ? `Rota atualizada · ${doneStops.length} fora do caminho`
              : "Rota traçada",
          );
        } else {
          L.polyline(
            pathPoints.map((p) => [p.lat, p.lng] as [number, number]),
            { color: "#2f6fed", weight: 4, opacity: 0.75, dashArray: "8 6" },
          ).addTo(layers);
          setStatus("Rota aproximada (linha reta)");
        }
      } else if (pathPoints.length === 1 && routeStops.length === 1) {
        setStatus("Última parada da rota");
      } else if (routeStops.length === 0 && doneStops.length > 0) {
        setStatus("Rota concluída — finalizados fora do caminho");
        doneStops.forEach((s) => bounds.push([s.lat, s.lng]));
      } else {
        setStatus("Aguardando localização e paradas");
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      }
      requestAnimationFrame(() => map.invalidateSize());
    }

    void setup();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, routeKey, doneKey]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs text-[var(--muted)]">
        <span className="min-w-0 truncate">{status}</span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)]" /> Rota
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Feito
          </span>
        </span>
      </div>
      <div ref={containerRef} className="z-0 h-56 w-full" />
    </div>
  );
}
