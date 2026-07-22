"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import {
  dismissNotification,
  markNotificationRead,
} from "@/lib/data/actions";
import { Section } from "@/components/ui/misc";

type AlertItem = {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
};

export function DashboardAlerts({ alerts }: { alerts: AlertItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (alerts.length === 0) return null;

  function closeAlert(id: string, alreadyRead: boolean) {
    startTransition(async () => {
      if (alreadyRead) {
        await dismissNotification(id);
      } else {
        await markNotificationRead(id);
        await dismissNotification(id);
      }
      toast.success("Aviso fechado");
      router.refresh();
    });
  }

  return (
    <Section
      title="Avisos"
      action={
        <Link
          href="/notifications"
          className="relative z-10 text-xs text-[var(--brand)]"
        >
          Ver todos
        </Link>
      }
    >
      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="relative z-10 flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
            <Link
              href={a.link || "/notifications"}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-[var(--muted)]">{a.message}</p>
            </Link>
            <button
              type="button"
              aria-label="Fechar aviso"
              disabled={pending}
              className="relative z-20 -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAlert(a.id, a.read);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}
