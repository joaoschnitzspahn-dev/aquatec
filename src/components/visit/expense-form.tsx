"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createExpense } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function ExpenseForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
      action={(fd) => {
        startTransition(async () => {
          await createExpense(fd);
          toast.success("Despesa registrada");
        });
      }}
    >
      <div>
        <Label>Descrição</Label>
        <Input name="description" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Categoria</Label>
          <Select name="category" defaultValue="FUEL">
            <option value="FUEL">Combustível</option>
            <option value="PARTS">Peças</option>
            <option value="TOOLS">Ferramentas</option>
            <option value="OTHER">Outros</option>
          </Select>
        </div>
        <div>
          <Label>Valor</Label>
          <Input name="amount" type="number" step="0.01" required />
        </div>
      </div>
      <div>
        <Label>Data</Label>
        <Input
          name="date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        Salvar despesa
      </Button>
    </form>
  );
}
