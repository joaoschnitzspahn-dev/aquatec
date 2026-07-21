import { cookies } from "next/headers";
import type { DemoStore, ServiceVisit, VisitStatus } from "./types";
import { getStore } from "./store";

export const DEMO_VISITS_COOKIE = "aquatec_demo_visits";

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
  observations?: string;
  createdAt: string;
  checklist?: Record<string, boolean>;
  hasArrivalPhoto?: boolean;
  hasFinalPhoto?: boolean;
};

function visitIdForAppointment(appointmentId: string) {
  return `visit_${appointmentId}`;
}

export function appointmentIdFromVisitId(visitId: string) {
  if (visitId.startsWith("visit_")) return visitId.slice("visit_".length);
  return undefined;
}

async function readPersisted(): Promise<Record<string, PersistedVisit>> {
  try {
    const jar = await cookies();
    const raw = jar.get(DEMO_VISITS_COOKIE)?.value;
    if (!raw) return {};
    return JSON.parse(decodeURIComponent(raw)) as Record<string, PersistedVisit>;
  } catch {
    return {};
  }
}

async function writePersisted(map: Record<string, PersistedVisit>) {
  const jar = await cookies();
  jar.set(DEMO_VISITS_COOKIE, encodeURIComponent(JSON.stringify(map)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function persistVisitState(visit: ServiceVisit, extra?: Partial<PersistedVisit>) {
  const map = await readPersisted();
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
    observations: visit.observations,
    createdAt: visit.createdAt,
    ...extra,
    checklist: extra?.checklist ?? map[visit.id]?.checklist,
    hasArrivalPhoto: extra?.hasArrivalPhoto ?? map[visit.id]?.hasArrivalPhoto,
    hasFinalPhoto: extra?.hasFinalPhoto ?? map[visit.id]?.hasFinalPhoto,
  };
  await writePersisted(map);
}

export async function persistChecklist(visitId: string, itemId: string, checked: boolean) {
  const map = await readPersisted();
  const current = map[visitId];
  if (!current) return;
  current.checklist = { ...(current.checklist || {}), [itemId]: checked };
  await writePersisted(map);
}

/** Garante visita em memória + cookie (necessário no Vercel serverless). */
export async function ensureVisit(visitId: string): Promise<ServiceVisit | null> {
  const store = getStore();
  const persisted = await readPersisted();

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
    visit.observations = saved.observations;
  }

  if (!visit) return null;

  // checklist base
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
  const store = getStore();
  const apt = store.appointments.find((a) => a.id === appointmentId);
  if (!apt) return null;
  const visitId = visitIdForAppointment(appointmentId);
  return ensureVisit(visitId);
}

export function getVisitIdForAppointment(appointmentId: string) {
  return visitIdForAppointment(appointmentId);
}

export async function hydrateStoreFromCookies(store: DemoStore) {
  const persisted = await readPersisted();
  for (const saved of Object.values(persisted)) {
    const idx = store.visits.findIndex((v) => v.id === saved.id);
    if (idx >= 0) {
      store.visits[idx] = { ...store.visits[idx], ...saved };
    } else if (saved.appointmentId) {
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
        observations: saved.observations,
        createdAt: saved.createdAt,
      });
    }
  }
}
