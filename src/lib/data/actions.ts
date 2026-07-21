"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/data/store";
import { requireUser } from "@/lib/auth/session";
import { assertCan, can } from "@/lib/auth/permissions";
import { id } from "@/lib/utils";
import type {
  AppointmentStatus,
  ClientStatus,
  ExpenseCategory,
  PoolType,
  Role,
  SaleType,
  StockSource,
} from "@/lib/data/types";

function audit(
  companyId: string,
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  const store = getStore();
  store.auditLogs.unshift({
    id: id(),
    companyId,
    userId,
    action,
    entity,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}

function notify(
  companyId: string,
  type: "LOW_STOCK" | "COMPANY_LOW_STOCK" | "GENERAL" | "NEW_APPOINTMENT",
  title: string,
  message: string,
  link?: string,
  userId?: string,
) {
  const store = getStore();
  store.notifications.unshift({
    id: id(),
    companyId,
    userId,
    type,
    title,
    message,
    read: false,
    link,
    createdAt: new Date().toISOString(),
  });
}

export async function getDashboardData() {
  const user = await requireUser();
  const { hydrateDemoStore } = await import("./persist");
  const store = await hydrateDemoStore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let appointments = store.appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return d >= today && d < tomorrow && a.companyId === user.companyId;
  });

  if (user.role === "EMPLOYEE") {
    appointments = appointments.filter((a) => a.employeeId === user.id);
  }

  const enriched = appointments
    .map((a) => ({
      ...a,
      client: store.clients.find((c) => c.id === a.clientId)!,
      employee: store.users.find((u) => u.id === a.employeeId)!,
    }))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  const next = enriched.find((a) => a.status === "SCHEDULED");
  const pending = enriched.filter((a) => a.status === "SCHEDULED").length;
  const completedToday = store.visits.filter((v) => {
    if (v.status !== "COMPLETED" || !v.finishedAt) return false;
    const d = new Date(v.finishedAt);
    return d >= today && d < tomorrow && v.companyId === user.companyId;
  });

  const durations = store.visits
    .filter((v) => v.durationMinutes && v.companyId === user.companyId)
    .map((v) => v.durationMinutes!);
  const avgTime =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const lowStockProducts = store.products.filter(
    (p) => p.companyId === user.companyId && p.quantity <= p.minQuantity,
  );
  const lowClientStock = store.clientStock.filter((cs) => {
    const client = store.clients.find((c) => c.id === cs.clientId);
    return client?.companyId === user.companyId && cs.quantity <= cs.minQuantity;
  });

  const salesToday = store.sales.filter((s) => {
    const d = new Date(s.date);
    return d >= today && d < tomorrow && s.companyId === user.companyId;
  });
  const revenue = salesToday.reduce((acc, s) => acc + s.total, 0);

  const alerts = store.notifications
    .filter((n) => n.companyId === user.companyId && !n.read)
    .slice(0, 5);

  return {
    user,
    todayCount: enriched.length,
    next,
    pending,
    avgTime,
    alerts,
    master: can(user, "reports:read")
      ? {
          clients: store.clients.filter(
            (c) => c.companyId === user.companyId && c.status === "ACTIVE",
          ).length,
          online: store.users.filter(
            (u) => u.companyId === user.companyId && u.isOnline,
          ).length,
          lowStock: lowStockProducts.length,
          lowClientStock: lowClientStock.length,
          completedToday: completedToday.length,
          revenue,
          lowStockProducts,
        }
      : null,
  };
}

export async function listClients(query?: string) {
  const user = await requireUser();
  assertCan(user, "clients:read");
  const { hydrateDemoStore } = await import("./persist");
  const store = await hydrateDemoStore();
  let clients = store.clients.filter((c) => c.companyId === user.companyId);
  if (user.role === "EMPLOYEE") {
    clients = clients.filter((c) => c.responsibleId === user.id);
  }
  if (query) {
    const q = query.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }
  return clients.map((c) => ({
    ...c,
    responsible: store.users.find((u) => u.id === c.responsibleId),
  }));
}

export async function getClient(clientId: string) {
  const user = await requireUser();
  assertCan(user, "clients:read");
  const { hydrateDemoStore } = await import("./persist");
  const store = await hydrateDemoStore();
  const client = store.clients.find(
    (c) => c.id === clientId && c.companyId === user.companyId,
  );
  if (!client) throw new Error("Cliente não encontrado");

  const stock = store.clientStock
    .filter((s) => s.clientId === clientId)
    .map((s) => ({
      ...s,
      product: store.products.find((p) => p.id === s.productId)!,
    }));

  const visits = store.visits
    .filter((v) => v.clientId === clientId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((v) => ({
      ...v,
      employee: store.users.find((u) => u.id === v.employeeId)!,
      photos: store.photos.filter((p) => p.visitId === v.id),
      usages: store.usages
        .filter((u) => u.visitId === v.id)
        .map((u) => ({
          ...u,
          product: store.products.find((p) => p.id === u.productId)!,
        })),
      readings: store.readings.filter((r) => r.visitId === v.id),
      checklist: store.checklistResponses.filter((r) => r.visitId === v.id),
      notes: store.notes.filter((n) => n.visitId === v.id),
    }));

  const appointments = store.appointments
    .filter(
      (a) =>
        a.clientId === clientId &&
        new Date(a.scheduledAt) >= new Date() &&
        a.status === "SCHEDULED",
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  const equipment = store.equipment.filter((e) => e.clientId === clientId);
  const photos = store.photos.filter((p) =>
    visits.some((v) => v.id === p.visitId),
  );

  return {
    client: {
      ...client,
      responsible: store.users.find((u) => u.id === client.responsibleId),
    },
    stock,
    visits,
    appointments,
    equipment,
    photos,
    readings: store.readings
      .filter((r) => visits.some((v) => v.id === r.visitId))
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    employees: store.users.filter(
      (u) => u.companyId === user.companyId && u.active,
    ),
    products: store.products.filter(
      (p) => p.companyId === user.companyId && p.active,
    ),
    user,
  };
}

export async function upsertClient(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "clients:write");
  const { hydrateDemoStore, persistClientsAndStock } = await import("./persist");
  const store = await hydrateDemoStore();
  const clientId = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || "") || undefined,
    whatsapp: String(formData.get("whatsapp") || "") || undefined,
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || "") || undefined,
    state: String(formData.get("state") || "") || undefined,
    zipCode: String(formData.get("zipCode") || "") || undefined,
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : undefined,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : undefined,
    notes: String(formData.get("notes") || "") || undefined,
    poolType: String(formData.get("poolType") || "FIBRA") as PoolType,
    volumeLiters: formData.get("volumeLiters")
      ? Number(formData.get("volumeLiters"))
      : undefined,
    serviceDays: String(formData.get("serviceDays") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    serviceTime: String(formData.get("serviceTime") || "") || undefined,
    responsibleId: String(formData.get("responsibleId") || "") || undefined,
    status: String(formData.get("status") || "ACTIVE") as ClientStatus,
  };

  let savedId = clientId;
  if (clientId) {
    const idx = store.clients.findIndex((c) => c.id === clientId);
    if (idx >= 0) {
      store.clients[idx] = { ...store.clients[idx], ...payload };
      audit(user.companyId, user.id, "UPDATE", "Client", clientId, payload);
    }
  } else {
    savedId = id();
    store.clients.push({
      id: savedId,
      companyId: user.companyId,
      qrCodeToken: `qr_${savedId.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...payload,
    });
    audit(user.companyId, user.id, "CREATE", "Client", savedId, payload);
  }

  await persistClientsAndStock(store);
  revalidatePath("/clients");
  revalidatePath(`/clients/${savedId}`);
  return { ok: true, id: savedId };
}

export async function deleteClient(clientId: string) {
  const user = await requireUser();
  assertCan(user, "clients:delete");
  const { hydrateDemoStore, persistClientsAndStock, markClientDeleted } =
    await import("./persist");
  const store = await hydrateDemoStore();
  store.clients = store.clients.filter((c) => c.id !== clientId);
  store.clientStock = store.clientStock.filter((s) => s.clientId !== clientId);
  await markClientDeleted(clientId);
  await persistClientsAndStock(store);
  audit(user.companyId, user.id, "DELETE", "Client", clientId);
  revalidatePath("/clients");
  return { ok: true };
}

export async function listProducts() {
  const user = await requireUser();
  assertCan(user, "stock:read");
  const { hydrateDemoStore } = await import("./persist");
  const store = await hydrateDemoStore();
  return store.products.filter((p) => p.companyId === user.companyId);
}

export async function upsertProduct(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "stock:write");
  const { hydrateDemoStore, persistProducts } = await import("./persist");
  const store = await hydrateDemoStore();
  const productId = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || "") || undefined,
    supplier: String(formData.get("supplier") || "") || undefined,
    purchasePrice: Number(formData.get("purchasePrice") || 0),
    salePrice: Number(formData.get("salePrice") || 0),
    quantity: Number(formData.get("quantity") || 0),
    minQuantity: Number(formData.get("minQuantity") || 0),
    unit: String(formData.get("unit") || "un"),
    code: String(formData.get("code") || "") || undefined,
    active: String(formData.get("active") || "true") === "true",
  };

  if (productId) {
    const idx = store.products.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      store.products[idx] = { ...store.products[idx], ...payload };
      if (store.products[idx].quantity <= store.products[idx].minQuantity) {
        notify(
          user.companyId,
          "COMPANY_LOW_STOCK",
          "Estoque baixo",
          `${payload.name} abaixo do mínimo.`,
          "/stock",
        );
      }
      audit(user.companyId, user.id, "UPDATE", "Product", productId);
    }
  } else {
    const newId = id();
    store.products.push({
      id: newId,
      companyId: user.companyId,
      ...payload,
    });
    audit(user.companyId, user.id, "CREATE", "Product", newId);
  }
  await persistProducts(store);
  revalidatePath("/stock");
  return { ok: true };
}

export async function updateClientStock(formData: FormData) {
  const user = await requireUser();
  const { hydrateDemoStore, persistClientsAndStock } = await import("./persist");
  const store = await hydrateDemoStore();
  const clientId = String(formData.get("clientId"));
  const productId = String(formData.get("productId"));
  const quantity = Number(formData.get("quantity") || 0);
  const existing = store.clientStock.find(
    (s) => s.clientId === clientId && s.productId === productId,
  );
  if (existing) {
    existing.quantity = quantity;
    existing.minQuantity = Number(
      formData.get("minQuantity") || existing.minQuantity,
    );
    existing.updatedAt = new Date().toISOString();
    if (existing.quantity <= existing.minQuantity) {
      const client = store.clients.find((c) => c.id === clientId);
      const product = store.products.find((p) => p.id === productId);
      notify(
        user.companyId,
        "LOW_STOCK",
        "Estoque do cliente",
        `${client?.name} — ${product?.name} abaixo do mínimo.`,
        `/clients/${clientId}`,
      );
    }
  } else {
    store.clientStock.push({
      id: id(),
      clientId,
      productId,
      quantity,
      unit: String(formData.get("unit") || "un"),
      minQuantity: Number(formData.get("minQuantity") || 1),
      updatedAt: new Date().toISOString(),
    });
  }
  await persistClientsAndStock(store);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function listAppointments(
  range: "today" | "week" | "month" | "calendar",
  anchorIso?: string,
) {
  const user = await requireUser();
  const store = getStore();
  const now = anchorIso ? new Date(anchorIso) : new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  if (range === "today") {
    end.setDate(end.getDate() + 1);
  } else if (range === "week") {
    end.setDate(end.getDate() + 7);
  } else if (range === "month") {
    end.setMonth(end.getMonth() + 1);
  } else {
    // full calendar month around anchor
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(1);
  }

  let list = store.appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return a.companyId === user.companyId && d >= start && d < end;
  });
  if (user.role === "EMPLOYEE") {
    list = list.filter((a) => a.employeeId === user.id);
  }

  return list
    .map((a) => ({
      ...a,
      client: store.clients.find((c) => c.id === a.clientId)!,
      employee: store.users.find((u) => u.id === a.employeeId)!,
      visit: store.visits.find((v) => v.appointmentId === a.id),
    }))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
}

export async function upsertAppointment(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "schedule:write");
  const store = getStore();
  const appointmentId = String(formData.get("id") || "");
  const payload = {
    clientId: String(formData.get("clientId")),
    employeeId: String(formData.get("employeeId")),
    scheduledAt: new Date(String(formData.get("scheduledAt"))).toISOString(),
    notes: String(formData.get("notes") || "") || undefined,
    status: String(formData.get("status") || "SCHEDULED") as AppointmentStatus,
  };

  if (appointmentId) {
    const idx = store.appointments.findIndex((a) => a.id === appointmentId);
    if (idx >= 0) store.appointments[idx] = { ...store.appointments[idx], ...payload };
  } else {
    const newId = id();
    store.appointments.push({
      id: newId,
      companyId: user.companyId,
      ...payload,
    });
    notify(
      user.companyId,
      "NEW_APPOINTMENT",
      "Novo atendimento",
      "Um novo atendimento foi agendado.",
      "/schedule",
      payload.employeeId,
    );
    audit(user.companyId, user.id, "CREATE", "Appointment", newId);
  }
  revalidatePath("/schedule");
  return { ok: true };
}

export async function getOrCreateVisit(appointmentId: string) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  const apt = store.appointments.find((a) => a.id === appointmentId);
  if (!apt) throw new Error("Agendamento não encontrado");

  const { ensureVisitForAppointment, getVisitIdForAppointment, persistVisitState } =
    await import("./persist");

  const visit = await ensureVisitForAppointment(appointmentId);
  if (!visit) throw new Error("Não foi possível abrir o atendimento");

  await persistVisitState(visit);
  return getVisit(getVisitIdForAppointment(appointmentId));
}

export async function getVisit(visitId: string) {
  const user = await requireUser();
  const { ensureVisit } = await import("./persist");
  const visit = await ensureVisit(visitId);
  if (!visit) throw new Error("Atendimento não encontrado");

  const store = getStore();
  const client = store.clients.find((c) => c.id === visit.clientId)!;
  const employee = store.users.find((u) => u.id === visit.employeeId)!;
  const checklist = store.checklistItems
    .map((item) => ({
      ...item,
      response: store.checklistResponses.find(
        (r) => r.visitId === visit.id && r.itemId === item.id,
      ),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    visit,
    client,
    employee,
    checklist,
    readings: store.readings.filter((r) => r.visitId === visit.id),
    usages: store.usages
      .filter((u) => u.visitId === visit.id)
      .map((u) => ({
        ...u,
        product: store.products.find((p) => p.id === u.productId)!,
      })),
    photos: store.photos.filter((p) => p.visitId === visit.id),
    notes: store.notes.filter((n) => n.visitId === visit.id),
    clientStock: store.clientStock
      .filter((s) => s.clientId === visit.clientId)
      .map((s) => ({
        ...s,
        product: store.products.find((p) => p.id === s.productId)!,
      })),
    products: store.products.filter(
      (p) => p.companyId === user.companyId && p.active,
    ),
    user,
  };
}

export async function startVisit(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  let visitId = String(formData.get("visitId") || "");
  const appointmentId = String(formData.get("appointmentId") || "");
  const photoUrl = String(formData.get("photoUrl") || "");
  if (!photoUrl) return { error: "Foto de chegada obrigatória." };

  const { ensureVisit, ensureVisitForAppointment, persistVisitState } =
    await import("./persist");

  let visit = visitId ? await ensureVisit(visitId) : null;
  if (!visit && appointmentId) {
    visit = await ensureVisitForAppointment(appointmentId);
    visitId = visit?.id || "";
  }
  if (!visit) {
    return {
      error: "Atendimento não encontrado. Volte na agenda e abra de novo.",
    };
  }

  const client = store.clients.find((c) => c.id === visit.clientId);
  const { distanceMeters, formatDistance } = await import("@/lib/utils");

  const lat = formData.get("latitude")
    ? Number(formData.get("latitude"))
    : undefined;
  const lng = formData.get("longitude")
    ? Number(formData.get("longitude"))
    : undefined;

  // Sempre libera — GPS divergente só registra alerta para o Master
  const MISMATCH_THRESHOLD_M = 150;
  let distance: number | undefined;
  let mismatch = false;
  let gpsUnavailable = false;

  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    visit.startLatitude = lat;
    visit.startLongitude = lng;
    if (client?.latitude != null && client?.longitude != null) {
      distance = distanceMeters(lat, lng, client.latitude, client.longitude);
      mismatch = distance > MISMATCH_THRESHOLD_M;
    }
  } else {
    gpsUnavailable = true;
  }

  visit.status = "STARTED";
  visit.startedAt = new Date().toISOString();
  visit.startDistanceMeters = distance;
  visit.locationMismatch = mismatch;
  visit.gpsUnavailable = gpsUnavailable;

  store.photos = store.photos.filter(
    (p) => !(p.visitId === visit.id && p.type === "ARRIVAL"),
  );
  store.photos.push({
    id: id(),
    visitId: visit.id,
    type: "ARRIVAL",
    url: photoUrl,
    caption: "Foto de chegada",
    createdAt: new Date().toISOString(),
  });

  const coordsLabel =
    lat != null && lng != null
      ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      : "GPS indisponível";
  const distanceLabel =
    distance != null
      ? ` · ${formatDistance(distance)} do endereço cadastrado`
      : client?.latitude == null
        ? " · cliente sem GPS cadastrado"
        : "";
  const mismatchLabel = mismatch
    ? " · ATENÇÃO: localização diferente do endereço"
    : "";

  store.notes.unshift({
    id: id(),
    visitId: visit.id,
    content: `Chegada registrada por ${user.name}. Coordenada: ${coordsLabel}${distanceLabel}${mismatchLabel}.`,
    createdAt: new Date().toISOString(),
  });

  if (visit.appointmentId) {
    const apt = store.appointments.find((a) => a.id === visit.appointmentId);
    if (apt) apt.status = "IN_PROGRESS";
  }

  if (mismatch || gpsUnavailable) {
    notify(
      user.companyId,
      "GENERAL",
      mismatch ? "GPS divergente na chegada" : "Chegada sem GPS",
      mismatch
        ? `${user.name} iniciou em ${client?.name || "cliente"} a ${formatDistance(distance!)} do endereço. Coordenada: ${coordsLabel}.`
        : `${user.name} iniciou em ${client?.name || "cliente"} sem GPS. Foto registrada.`,
      `/visits/${visit.id}`,
    );
  }

  await persistVisitState(visit, { hasArrivalPhoto: true });
  audit(user.companyId, user.id, "START", "ServiceVisit", visit.id, {
    latitude: lat,
    longitude: lng,
    distanceMeters: distance,
    locationMismatch: mismatch,
    gpsUnavailable,
  });
  revalidatePath(`/visits/${visit.id}`);
  revalidatePath(`/clients/${visit.clientId}`);
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  return {
    ok: true,
    locationMismatch: mismatch,
    gpsUnavailable,
    distanceMeters: distance,
    latitude: lat,
    longitude: lng,
  };
}

export async function toggleChecklist(visitId: string, itemId: string) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  const { ensureVisit, persistChecklist } = await import("./persist");
  const visit = await ensureVisit(visitId);
  if (!visit) return { error: "Atendimento não encontrado" };

  const response = store.checklistResponses.find(
    (r) => r.visitId === visit.id && r.itemId === itemId,
  );
  if (response) {
    response.checked = !response.checked;
    response.checkedAt = response.checked
      ? new Date().toISOString()
      : undefined;
    await persistChecklist(visit.id, itemId, response.checked);
  }
  revalidatePath(`/visits/${visit.id}`);
  return { ok: true };
}

export async function addProductUsage(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  const visitId = String(formData.get("visitId"));
  const productId = String(formData.get("productId"));
  const quantity = Number(formData.get("quantity") || 0);
  let source = String(formData.get("source") || "CLIENT") as StockSource;
  const { ensureVisit } = await import("./persist");
  const visit = await ensureVisit(visitId);
  if (!visit) return { error: "Atendimento não encontrado" };

  const clientStock = store.clientStock.find(
    (s) => s.clientId === visit.clientId && s.productId === productId,
  );

  if (source === "CLIENT") {
    if (!clientStock || clientStock.quantity < quantity) {
      return {
        needsCompanyStock: true,
        message: "Estoque do cliente insuficiente. Descontar da empresa?",
      };
    }
    clientStock.quantity -= quantity;
    clientStock.updatedAt = new Date().toISOString();
    if (clientStock.quantity <= clientStock.minQuantity) {
      const client = store.clients.find((c) => c.id === visit.clientId);
      const product = store.products.find((p) => p.id === productId);
      notify(
        user.companyId,
        "LOW_STOCK",
        "Estoque do cliente",
        `${client?.name} — ${product?.name} abaixo do mínimo.`,
        `/clients/${visit.clientId}`,
      );
    }
  } else {
    source = "COMPANY";
    const product = store.products.find((p) => p.id === productId);
    if (!product || product.quantity < quantity) {
      return { error: "Estoque da empresa insuficiente." };
    }
    product.quantity -= quantity;
    if (product.quantity <= product.minQuantity) {
      notify(
        user.companyId,
        "COMPANY_LOW_STOCK",
        "Estoque baixo",
        `${product.name} abaixo do mínimo.`,
        "/stock",
      );
    }
  }

  store.usages.push({
    id: id(),
    visitId: visit.id,
    productId,
    quantity,
    source,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/visits/${visit.id}`);
  return { ok: true };
}

export async function saveWaterReading(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  const visitId = String(formData.get("visitId"));
  const { ensureVisit } = await import("./persist");
  const visit = await ensureVisit(visitId);
  if (!visit) return { error: "Atendimento não encontrado" };

  store.readings.push({
    id: id(),
    visitId: visit.id,
    ph: formData.get("ph") ? Number(formData.get("ph")) : undefined,
    chlorine: formData.get("chlorine")
      ? Number(formData.get("chlorine"))
      : undefined,
    alkalinity: formData.get("alkalinity")
      ? Number(formData.get("alkalinity"))
      : undefined,
    temperature: formData.get("temperature")
      ? Number(formData.get("temperature"))
      : undefined,
    notes: String(formData.get("notes") || "") || undefined,
    recordedAt: new Date().toISOString(),
  });
  revalidatePath(`/visits/${visit.id}`);
  return { ok: true };
}

export async function addVisitNote(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  const visitId = String(formData.get("visitId"));
  const { ensureVisit } = await import("./persist");
  const visit = await ensureVisit(visitId);
  if (!visit) return { error: "Atendimento não encontrado" };

  store.notes.push({
    id: id(),
    visitId: visit.id,
    content: String(formData.get("content") || ""),
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/visits/${visit.id}`);
  return { ok: true };
}

export async function finishVisit(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "visits:execute");
  const store = getStore();
  const visitId = String(formData.get("visitId"));
  const photoUrl = String(formData.get("photoUrl") || "");
  const signatureDataUrl = String(formData.get("signatureDataUrl") || "");
  const { ensureVisit, persistVisitState } = await import("./persist");
  const visit = await ensureVisit(visitId);
  if (!visit) return { error: "Atendimento não encontrado" };

  const checklist = store.checklistResponses.filter((r) => r.visitId === visit.id);
  const required = store.checklistItems.filter((i) => i.required);
  const allRequired = required.every((item) =>
    checklist.find((r) => r.itemId === item.id && r.checked),
  );
  if (!allRequired) {
    return { error: "Conclua os itens obrigatórios do checklist." };
  }
  if (!photoUrl) return { error: "Foto final obrigatória." };

  visit.status = "COMPLETED";
  visit.finishedAt = new Date().toISOString();
  visit.observations = String(formData.get("observations") || "") || undefined;
  visit.signatureDataUrl = signatureDataUrl || undefined;
  visit.endLatitude = formData.get("latitude")
    ? Number(formData.get("latitude"))
    : undefined;
  visit.endLongitude = formData.get("longitude")
    ? Number(formData.get("longitude"))
    : undefined;

  if (visit.startedAt) {
    visit.durationMinutes = Math.round(
      (new Date(visit.finishedAt).getTime() -
        new Date(visit.startedAt).getTime()) /
        60000,
    );
  }

  store.photos.push({
    id: id(),
    visitId: visit.id,
    type: "FINAL",
    url: photoUrl,
    caption: "Foto final",
    createdAt: new Date().toISOString(),
  });

  if (signatureDataUrl) {
    store.photos.push({
      id: id(),
      visitId: visit.id,
      type: "SIGNATURE",
      url: signatureDataUrl,
      caption: "Assinatura do cliente",
      createdAt: new Date().toISOString(),
    });
  }

  if (visit.appointmentId) {
    const apt = store.appointments.find((a) => a.id === visit.appointmentId);
    if (apt) apt.status = "COMPLETED";
  }

  await persistVisitState(visit, { hasFinalPhoto: true });
  audit(user.companyId, user.id, "COMPLETE", "ServiceVisit", visit.id);
  revalidatePath(`/visits/${visit.id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function listEmployees() {
  const user = await requireUser();
  assertCan(user, "employees:read");
  const store = getStore();
  return store.users
    .filter((u) => u.companyId === user.companyId)
    .map((u) => {
      const { password: _password, ...rest } = u;
      void _password;
      return rest;
    });
}

export async function upsertEmployee(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "employees:write");
  const store = getStore();
  const employeeId = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "").toLowerCase(),
    phone: String(formData.get("phone") || "") || undefined,
    role: String(formData.get("role") || "EMPLOYEE") as Role,
    active: String(formData.get("active") || "true") === "true",
    password: String(formData.get("password") || "aquatec123"),
  };

  if (employeeId) {
    const idx = store.users.findIndex((u) => u.id === employeeId);
    if (idx >= 0) {
      store.users[idx] = {
        ...store.users[idx],
        ...payload,
        password: payload.password || store.users[idx].password,
      };
      audit(user.companyId, user.id, "UPDATE", "User", employeeId);
    }
  } else {
    const newId = id();
    store.users.push({
      id: newId,
      companyId: user.companyId,
      isOnline: false,
      customPermissions: [],
      ...payload,
    });
    audit(user.companyId, user.id, "CREATE", "User", newId);
  }
  revalidatePath("/employees");
  return { ok: true };
}

export async function deleteEmployee(employeeId: string) {
  const user = await requireUser();
  assertCan(user, "employees:delete");
  if (employeeId === user.id) return { error: "Não é possível excluir a si mesmo." };
  const store = getStore();
  store.users = store.users.filter((u) => u.id !== employeeId);
  audit(user.companyId, user.id, "DELETE", "User", employeeId);
  revalidatePath("/employees");
  return { ok: true };
}

export async function getReports() {
  const user = await requireUser();
  assertCan(user, "reports:read");
  const store = getStore();
  const visits = store.visits.filter(
    (v) => v.companyId === user.companyId && v.status === "COMPLETED",
  );

  const byEmployee = store.users
    .filter((u) => u.companyId === user.companyId)
    .map((u) => {
      const empVisits = visits.filter((v) => v.employeeId === u.id);
      const avg =
        empVisits.length > 0
          ? Math.round(
              empVisits.reduce((a, v) => a + (v.durationMinutes || 0), 0) /
                empVisits.length,
            )
          : 0;
      return {
        name: u.name,
        visits: empVisits.length,
        avgTime: avg,
      };
    });

  const productUsage = store.products.map((p) => {
    const qty = store.usages
      .filter((u) => u.productId === p.id)
      .reduce((a, u) => a + u.quantity, 0);
    return { name: p.name, quantity: qty };
  }).filter((p) => p.quantity > 0);

  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = visits.filter((v) => {
      if (!v.finishedAt) return false;
      const fd = new Date(v.finishedAt);
      return fd >= d && fd < next;
    }).length;
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      count,
    };
  });

  const revenue = store.sales
    .filter((s) => s.companyId === user.companyId)
    .reduce((a, s) => a + s.total, 0);

  return { byEmployee, productUsage, weekly, revenue, totalVisits: visits.length };
}

export async function listNotifications() {
  const user = await requireUser();
  const store = getStore();
  return store.notifications
    .filter(
      (n) =>
        n.companyId === user.companyId &&
        (!n.userId || n.userId === user.id),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function markNotificationRead(notificationId: string) {
  await requireUser();
  const store = getStore();
  const n = store.notifications.find((x) => x.id === notificationId);
  if (n) n.read = true;
  revalidatePath("/notifications");
  return { ok: true };
}

export async function globalSearch(query: string) {
  const user = await requireUser();
  const store = getStore();
  const q = query.toLowerCase().trim();
  if (!q) return { clients: [], products: [], visits: [], employees: [] };

  const clients = store.clients
    .filter(
      (c) =>
        c.companyId === user.companyId &&
        (c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)),
    )
    .slice(0, 8);

  const products = store.products
    .filter(
      (p) =>
        p.companyId === user.companyId &&
        (p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)),
    )
    .slice(0, 8);

  const employees = store.users
    .filter(
      (u) =>
        u.companyId === user.companyId &&
        (u.name.toLowerCase().includes(q) || u.email.includes(q)),
    )
    .slice(0, 8);

  const visits = store.visits
    .filter((v) => v.companyId === user.companyId)
    .map((v) => ({
      ...v,
      client: store.clients.find((c) => c.id === v.clientId),
    }))
    .filter((v) => v.client?.name.toLowerCase().includes(q))
    .slice(0, 8);

  return { clients, products, visits, employees };
}

export async function listExpenses() {
  const user = await requireUser();
  const store = getStore();
  let expenses = store.expenses.filter((e) => e.companyId === user.companyId);
  if (user.role === "EMPLOYEE") {
    expenses = expenses.filter((e) => e.employeeId === user.id);
  }
  return expenses.map((e) => ({
    ...e,
    employee: store.users.find((u) => u.id === e.employeeId)!,
  }));
}

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  const store = getStore();
  const expense = {
    id: id(),
    companyId: user.companyId,
    employeeId: user.role === "MASTER"
      ? String(formData.get("employeeId") || user.id)
      : user.id,
    category: String(formData.get("category") || "OTHER") as ExpenseCategory,
    description: String(formData.get("description") || ""),
    amount: Number(formData.get("amount") || 0),
    date: new Date(String(formData.get("date") || new Date())).toISOString(),
  };
  store.expenses.unshift(expense);
  audit(user.companyId, user.id, "CREATE", "Expense", expense.id);
  revalidatePath("/expenses");
  return { ok: true };
}

export async function listSales() {
  const user = await requireUser();
  assertCan(user, "finance:read");
  const store = getStore();
  return store.sales
    .filter((s) => s.companyId === user.companyId)
    .map((s) => ({
      ...s,
      client: store.clients.find((c) => c.id === s.clientId),
      employee: store.users.find((u) => u.id === s.employeeId)!,
    }));
}

export async function createSale(formData: FormData) {
  const user = await requireUser();
  assertCan(user, "finance:write");
  const store = getStore();
  const total = Number(formData.get("total") || 0);
  const sale = {
    id: id(),
    companyId: user.companyId,
    clientId: String(formData.get("clientId") || "") || undefined,
    employeeId: user.id,
    type: String(formData.get("type") || "PRODUCT") as SaleType,
    description: String(formData.get("description") || "") || undefined,
    total,
    date: new Date().toISOString(),
    items: [
      {
        name: String(formData.get("description") || "Venda"),
        quantity: 1,
        unitPrice: total,
        total,
      },
    ],
  };
  store.sales.unshift(sale);
  audit(user.companyId, user.id, "CREATE", "Sale", sale.id);
  revalidatePath("/sales");
  return { ok: true };
}

export async function listAuditLogs() {
  const user = await requireUser();
  assertCan(user, "audit:read");
  const store = getStore();
  return store.auditLogs
    .filter((a) => a.companyId === user.companyId)
    .map((a) => ({
      ...a,
      user: store.users.find((u) => u.id === a.userId),
    }));
}

export async function findClientByQr(token: string) {
  const user = await requireUser();
  const store = getStore();
  const client = store.clients.find(
    (c) => c.qrCodeToken === token && c.companyId === user.companyId,
  );
  return client ?? null;
}

export async function syncOfflinePayload(payload: {
  actions: { type: string; data: Record<string, unknown> }[];
}) {
  const user = await requireUser();
  // Demo: acknowledge offline sync queue
  audit(user.companyId, user.id, "SYNC", "OfflineQueue", undefined, {
    count: payload.actions.length,
  });
  return { ok: true, synced: payload.actions.length };
}

export async function getEmployeesForSelect() {
  const user = await requireUser();
  const store = getStore();
  return store.users.filter(
    (u) => u.companyId === user.companyId && u.active,
  );
}

export async function getClientsForSelect() {
  const user = await requireUser();
  const store = getStore();
  return store.clients.filter(
    (c) => c.companyId === user.companyId && c.status === "ACTIVE",
  );
}
