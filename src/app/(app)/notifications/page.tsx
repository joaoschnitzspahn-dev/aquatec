import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { EmptyState } from "@/components/ui/misc";
import { listNotifications } from "@/lib/data/actions";
import { formatDateTime } from "@/lib/utils";
import { MarkReadButton } from "@/components/visit/mark-read-button";
import { DismissNotificationButton } from "@/components/visit/dismiss-notification-button";

export default async function NotificationsPage() {
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Notificações" unread={unread} />
      <div className="space-y-2 animate-fade-up">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-3xl border p-4 ${
              n.read
                ? "border-[var(--border)] bg-[var(--surface)]"
                : "border-[var(--brand)]/30 bg-[var(--brand-soft)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{n.message}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {formatDateTime(n.createdAt)}
                </p>
                {n.link ? (
                  <Link
                    href={n.link}
                    className="mt-2 inline-block text-sm text-[var(--brand)]"
                  >
                    Abrir
                  </Link>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!n.read ? <MarkReadButton id={n.id} /> : null}
                <DismissNotificationButton id={n.id} />
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 ? (
          <EmptyState title="Sem notificações" />
        ) : null}
      </div>
    </>
  );
}
