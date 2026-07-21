import { cookies } from "next/headers";
import type {
  Client,
  ClientStockItem,
  DemoStore,
  Product,
  ServiceVisit,
  VisitStatus,
} from "./types";
import { getStore } from "./store";

export const DEMO_VISITS_COOKIE = "aquatec_demo_visits";
export const DEMO_DATA_COOKIE = "aquatec_demo_data";

export type PersistedVisit = {
  id: string;
  appointmentId?: string;
  clientId: string;
  employeeId: string;
  companyId: string;
  status: VisitStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMinutes?: number;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  startDistanceMeters?: number;
  locationMismatch?: boolean;
  gpsUnavailable?: boolean;
  observations?: string;
  createdAt: string;
  checklist?: Record<string, boolean>;
  hasArrivalPhoto?: boolean;
  hasFinalPhoto?: boolean;
};

type DemoDataBlob = {
  clients?: Client[];
  products?: Product[];
  clientStock?: ClientStockItem[];
  deletedClientIds?: string[];
  deletedProductIds?: string[];
};

function visitIdForAppointment(appointmentId: string) {
  return `visit_${appointmentId}`;
}

export function appointmentIdFromVisitId(visitId: string) {
  if (visitId.startsWith("visit_")) return visitId.slice("visit_".length);
  return undefined;
}

export function getVisitIdForAppointment(appointmentId: string) {
  return visitIdForAppointment(appointmentId);
}

async function readJsonCookie<T>(name: string): Promise<T | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(name)?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return null;
  }
}

async function writeJsonCookie(name: string, value: unknown) {
  const jar = await cookies();
  const payload = encodeURIComponent(JSON.stringify(value));
  // cookies ~4kb — keep payload lean
  if (payload.length > 3500) {
    console.warn(`[demo] cookie ${name} too large (${payload.length})`);
  }
  jar.set(name, payload, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function readPersistedVisits(): Promise<Record<string, PersistedVisit>> {
  return (await readJsonCookie<Record<string, PersistedVisit>>(DEMO_VISITS_COOKIE)) || {};
}

async function writePersistedVisits(map: Record<string, PersistedVisit>) {
  await writeJsonCookie(DEMO_VISITS_COOKIE, map);
}

async function readDemoData(): Promise<DemoDataBlob> {
  return (await readJsonCookie<DemoDataBlob>(DEMO_DATA_COOKIE)) || {};
}

async function writeDemoData(data: DemoDataBlob) {
  await writeJsonCookie(DEMO_DATA_COOKIE, data);
}

/** Aplica overlays de cookie no store em memória (Vercel serverless). */
export async function hydrateDemoStore(): Promise<DemoStore> {
  const store = getStore();
  const data = await readDemoData();
  const visits = await readPersistedVisits();

  if (data.deletedClientIds?.length) {
    store.clients = store.clients.filter(
      (c) => !data.deletedClientIds!.includes(c.id),
    );
  }
  if (data.deletedProductIds?.length) {
    store.products = store.products.filter(
      (p) => !data.deletedProductIds!.includes(p.id),
    );
  }

  if (data.clients?.length) {
    for (const client of data.clients) {
      const idx = store.clients.findIndex((c) => c.id === client.id);
      if (idx >= 0) store.clients[idx] = client;
      else store.clients.push(client);
    }
  }

  if (data.products?.length) {
    for (const product of data.products) {
      const idx = store.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) store.products[idx] = product;
      else store.products.push(product);
    }
  }

  if (data.clientStock?.length) {
    for (const item of data.clientStock) {
      const idx = store.clientStock.findIndex(
        (s) => s.clientId === item.clientId && s.productId === item.productId,
      );
      if (idx >= 0) store.clientStock[idx] = item;
      else store.clientStock.push(item);
    }
  }

  for (const saved of Object.values(visits)) {
    const idx = store.visits.findIndex((v) => v.id === saved.id);
    if (idx >= 0) {
      store.visits[idx] = { ...store.visits[idx], ...saved };
    } else {
      store.visits.push({
        id: saved.id,
        companyId: saved.companyId,
        appointmentId: saved.appointmentId,
        clientId: saved.clientId,
        employeeId: saved.employeeId,
        status: saved.status,
        startedAt: saved.startedAt,
        finishedAt: saved.finishedAt,
        durationMinutes: saved.durationMinutes,
        startLatitude: saved.startLatitude,
        startLongitude: saved.startLongitude,
        endLatitude: saved.endLatitude,
        endLongitude: saved.endLongitude,
        startDistanceMeters: saved.startDistanceMeters,
        locationMismatch: saved.locationMismatch,
        gpsUnavailable: saved.gpsUnavailable,
        observations: saved.observations,
        createdAt: saved.createdAt,
      });
    }
  }

  return store;
}

export async function persistClientsAndStock(store: DemoStore) {
  const data = await readDemoData();
  data.clients = store.clients;
  data.clientStock = store.clientStock;
  data.products = store.products;
  await writeDemoData(data);
}

export async function persistProducts(store: DemoStore) {
  const data = await readDemoData();
  data.products = store.products;
  await writeDemoData(data);
}

export async function markClientDeleted(clientId: string) {
  const data = await readDemoData();
  data.deletedClientIds = Array.from(
    new Set([...(data.deletedClientIds || []), clientId]),
  );
  data.clients = (data.clients || []).filter((c) => c.id !== clientId);
  await writeDemoData(data);
}

export async function persistVisitState(
  visit: ServiceVisit,
  extra?: Partial<PersistedVisit>,
) {
  const map = await readPersistedVisits();
  map[visit.id] = {
    id: visit.id,
    appointmentId: visit.appointmentId,
    clientId: visit.clientId,
    employeeId: visit.employeeId,
    companyId: visit.companyId,
    status: visit.status,
    startedAt: visit.startedAt,
    finishedAt: visit.finishedAt,
    durationMinutes: visit.durationMinutes,
    startLatitude: visit.startLatitude,
    startLongitude: visit.startLongitude,
    endLatitude: visit.endLatitude,
    endLongitude: visit.endLongitude,
    startDistanceMeters: visit.startDistanceMeters,
    locationMismatch: visit.locationMismatch,
    gpsUnavailable: visit.gpsUnavailable,
    observations: visit.observations,
    createdAt: visit.createdAt,
    ...extra,
    checklist: extra?.checklist ?? map[visit.id]?.checklist,
    hasArrivalPhoto: extra?.hasArrivalPhoto ?? map[visit.id]?.hasArrivalPhoto,
    hasFinalPhoto: extra?.hasFinalPhoto ?? map[visit.id]?.hasFinalPhoto,
  };
  await writePersistedVisits(map);
}

export async function persistChecklist(
  visitId: string,
  itemId: string,
  checked: boolean,
) {
  const map = await readPersistedVisits();
  const current = map[visitId];
  if (!current) return;
  current.checklist = { ...(current.checklist || {}), [itemId]: checked };
  await writePersistedVisits(map);
}

export async function ensureVisit(visitId: string): Promise<ServiceVisit | null> {
  const store = await hydrateDemoStore();
  const persisted = await readPersistedVisits();

  let visit = store.visits.find((v) => v.id === visitId);
  const aptId =
    visit?.appointmentId ||
    persisted[visitId]?.appointmentId ||
    appointmentIdFromVisitId(visitId);

  if (!visit && aptId) {
    const apt = store.appointments.find((a) => a.id === aptId);
    if (!apt) return null;
    const saved = persisted[visitIdForAppointment(aptId)] || persisted[visitId];
    visit = {
      id: visitIdForAppointment(aptId),
      companyId: apt.companyId || store.company.id,
      appointmentId: aptId,
      clientId: apt.clientId,
      employeeId: apt.employeeId,
      status: saved?.status || "PENDING",
      startedAt: saved?.startedAt,
      finishedAt: saved?.finishedAt,
      durationMinutes: saved?.durationMinutes,
      startLatitude: saved?.startLatitude,
      startLongitude: saved?.startLongitude,
      endLatitude: saved?.endLatitude,
      endLongitude: saved?.endLongitude,
      startDistanceMeters: saved?.startDistanceMeters,
      locationMismatch: saved?.locationMismatch,
      gpsUnavailable: saved?.gpsUnavailable,
      observations: saved?.observations,
      createdAt: saved?.createdAt || new Date().toISOString(),
    };
    store.visits.push(visit);
  } else if (visit && persisted[visit.id]) {
    const saved = persisted[visit.id];
    visit.status = saved.status;
    visit.startedAt = saved.startedAt;
    visit.finishedAt = saved.finishedAt;
    visit.durationMinutes = saved.durationMinutes;
    visit.startLatitude = saved.startLatitude;
    visit.startLongitude = saved.startLongitude;
    visit.endLatitude = saved.endLatitude;
    visit.endLongitude = saved.endLongitude;
    visit.startDistanceMeters = saved.startDistanceMeters;
    visit.locationMismatch = saved.locationMismatch;
    visit.gpsUnavailable = saved.gpsUnavailable;
    visit.observations = saved.observations;
  }

  if (!visit) return null;

  for (const item of store.checklistItems) {
    const exists = store.checklistResponses.find(
      (r) => r.visitId === visit!.id && r.itemId === item.id,
    );
    if (!exists) {
      const checked = Boolean(persisted[visit.id]?.checklist?.[item.id]);
      store.checklistResponses.push({
        visitId: visit.id,
        itemId: item.id,
        checked,
        checkedAt: checked ? new Date().toISOString() : undefined,
      });
    } else if (persisted[visit.id]?.checklist?.[item.id] !== undefined) {
      exists.checked = Boolean(persisted[visit.id]?.checklist?.[item.id]);
    }
  }

  return visit;
}

export async function ensureVisitForAppointment(appointmentId: string) {
  const store = await hydrateDemoStore();
  const apt = store.appointments.find((a) => a.id === appointmentId);
  if (!apt) return null;
  return ensureVisit(visitIdForAppointment(appointmentId));
}
