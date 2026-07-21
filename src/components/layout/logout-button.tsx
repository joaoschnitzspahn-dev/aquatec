"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      className="w-full"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await logoutAction();
          } catch (error) {
            // redirect() do Next.js lança NEXT_REDIRECT — ok
            const digest = (error as { digest?: string })?.digest;
            if (digest?.startsWith("NEXT_REDIRECT")) {
              router.replace("/login");
              router.refresh();
              return;
            }
          }
          router.replace("/login");
          router.refresh();
        });
      }}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}
