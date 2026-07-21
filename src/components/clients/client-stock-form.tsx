"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateClientStock } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function ClientStockForm({
  clientId,
  products,
}: {
  clientId: string;
  products: { id: string; name: string; unit: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
      action={(fd) => {
        startTransition(async () => {
          await updateClientStock(fd);
          toast.success("Estoque atualizado");
        });
      }}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <div>
        <Label>Produto</Label>
        <Select name="productId" required>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Quantidade</Label>
          <Input name="quantity" type="number" step="0.1" required />
        </div>
        <div>
          <Label>Mínimo</Label>
          <Input name="minQuantity" type="number" step="0.1" defaultValue={1} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        Salvar estoque
      </Button>
    </form>
  );
}
