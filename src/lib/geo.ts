/** GPS rápido: cache recente primeiro; alta precisão só se necessário. */

export type GeoPoint = { latitude: number; longitude: number };

const CACHE_KEY = "aquatec_geo_cache";
const CACHE_TTL_MS = 90_000;

type CachedGeo = GeoPoint & { at: number };

function readCache(): CachedGeo | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGeo;
    if (
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      Date.now() - parsed.at > CACHE_TTL_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(point: GeoPoint) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...point, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

function requestPosition(options: PositionOptions): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        writeCache(point);
        resolve(point);
      },
      () => resolve(null),
      options,
    );
  });
}

/**
 * Retorna posição o mais rápido possível.
 * 1) cache em memória/sessão
 * 2) fix rápido (baixa precisão, timeout curto)
 * 3) fallback alta precisão
 */
export async function getQuickGeo(opts?: {
  force?: boolean;
}): Promise<GeoPoint | null> {
  if (!opts?.force) {
    const cached = readCache();
    if (cached) return cached;
  }

  const fast = await requestPosition({
    enableHighAccuracy: false,
    timeout: 2500,
    maximumAge: 120_000,
  });
  if (fast) return fast;

  return requestPosition({
    enableHighAccuracy: true,
    timeout: 6000,
    maximumAge: 30_000,
  });
}

/** Aquace o GPS em background para a próxima leitura ser instantânea. */
export function warmGps() {
  if (typeof window === "undefined" || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      writeCache({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    },
    () => undefined,
    { enableHighAccuracy: false, timeout: 4000, maximumAge: 60_000 },
  );
}

export function orderByNearestNeighbor<
  T extends { latitude?: number; longitude?: number },
>(origin: { lat: number; lng: number }, stops: T[]): T[] {
  const remaining = stops.filter(
    (s) => s.latitude != null && s.longitude != null,
  );
  const withoutGps = stops.filter(
    (s) => s.latitude == null || s.longitude == null,
  );
  const ordered: T[] = [];
  let curLat = origin.lat;
  let curLng = origin.lng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      const d = haversine(
        curLat,
        curLng,
        s.latitude as number,
        s.longitude as number,
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    curLat = next.latitude as number;
    curLng = next.longitude as number;
  }

  return [...ordered, ...withoutGps];
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
