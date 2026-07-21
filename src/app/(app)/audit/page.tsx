import { TopBar } from "@/components/layout/top-bar";
import { EmptyState, Section } from "@/components/ui/misc";
import { listAuditLogs, listNotifications } from "@/lib/data/actions";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  const logs = await listAuditLogs();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Auditoria" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <Section title="Alterações recentes">
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
              >
                <p className="font-semibold">
                  {log.action} · {log.entity}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {log.user?.name || "Sistema"} · {formatDateTime(log.createdAt)}
                </p>
                {log.entityId ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    ID: {log.entityId}
                  </p>
                ) : null}
              </div>
            ))}
            {logs.length === 0 ? <EmptyState title="Sem logs" /> : null}
          </div>
        </Section>
      </div>
    </>
  );
}
