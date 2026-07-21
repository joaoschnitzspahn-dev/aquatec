import { NextResponse } from "next/server";
import { getStore } from "@/lib/data/store";
import { id } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const now = new Date();
  let created = 0;

  for (const reminder of store.reminders.filter((r) => r.active)) {
    if (new Date(reminder.nextRunAt) <= now) {
      const client = store.clients.find((c) => c.id === reminder.clientId);
      store.notifications.unshift({
        id: id(),
        companyId: reminder.companyId,
        type: "GENERAL",
        title: "Lembrete de manutenção",
        message: `${reminder.title} — ${client?.name || "cliente"}`,
        read: false,
        link: client ? `/clients/${client.id}` : "/schedule",
        createdAt: now.toISOString(),
      });
      reminder.nextRunAt = new Date(
        now.getTime() + reminder.frequencyDays * 86400000,
      ).toISOString();
      created += 1;
    }
  }

  return NextResponse.json({ ok: true, created });
}
