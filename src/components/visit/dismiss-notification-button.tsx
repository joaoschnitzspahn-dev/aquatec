"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { dismissNotification } from "@/lib/data/actions";

export function DismissNotificationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Fechar notificação"
      disabled={pending}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-50"
      onClick={() => {
        startTransition(async () => {
          await dismissNotification(id);
          router.refresh();
        });
      }}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
