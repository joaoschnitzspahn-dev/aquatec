"use client";

import Dexie, { type Table } from "dexie";

export interface OfflineAction {
  id?: number;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

class AquatecOfflineDB extends Dexie {
  queue!: Table<OfflineAction, number>;

  constructor() {
    super("aquatec_offline");
    this.version(1).stores({
      queue: "++id, type, createdAt",
    });
  }
}

export const offlineDb = new AquatecOfflineDB();

export async function enqueueAction(
  type: string,
  data: Record<string, unknown>,
) {
  await offlineDb.queue.add({
    type,
    data,
    createdAt: new Date().toISOString(),
  });
}

export async function syncQueue() {
  const actions = await offlineDb.queue.toArray();
  if (actions.length === 0) return;

  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actions: actions.map(({ type, data }) => ({ type, data })),
    }),
  });

  if (res.ok) {
    await offlineDb.queue.clear();
  }
}
