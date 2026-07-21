"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteEmployee } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";

export function DeleteEmployeeButton({ employeeId }: { employeeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={() => {
        if (!confirm("Excluir funcionário?")) return;
        startTransition(async () => {
          const res = await deleteEmployee(employeeId);
          if (res.error) toast.error(res.error);
          else toast.success("Excluído");
        });
      }}
    >
      <Trash2 className="h-4 w-4 text-[var(--danger)]" />
    </Button>
  );
}
