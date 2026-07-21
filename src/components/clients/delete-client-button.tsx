"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteClient } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (!confirm("Excluir este cliente?")) return;
        startTransition(async () => {
          await deleteClient(clientId);
          toast.success("Cliente excluído");
          router.push("/clients");
        });
      }}
    >
      Excluir cliente
    </Button>
  );
}
