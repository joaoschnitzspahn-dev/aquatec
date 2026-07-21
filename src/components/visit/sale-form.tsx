"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createSale } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function SaleForm({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
      action={(fd) => {
        startTransition(async () => {
          await createSale(fd);
          toast.success("Venda registrada");
        });
      }}
    >
      <div>
        <Label>Tipo</Label>
        <Select name="type" defaultValue="PRODUCT">
          <option value="PRODUCT">Produto</option>
          <option value="EXTRA_SERVICE">Serviço extra</option>
        </Select>
      </div>
      <div>
        <Label>Cliente</Label>
        <Select name="clientId">
          <option value="">Avulso</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Descrição</Label>
        <Input name="description" required />
      </div>
      <div>
        <Label>Total</Label>
        <Input name="total" type="number" step="0.01" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        Registrar venda
      </Button>
    </form>
  );
}
