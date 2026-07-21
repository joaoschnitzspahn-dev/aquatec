"use client";

import { useTransition } from "react";
import { markNotificationRead } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markNotificationRead(id);
        });
      }}
    >
      Lida
    </Button>
  );
}
