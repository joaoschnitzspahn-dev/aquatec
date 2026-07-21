"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { upsertProduct } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Section } from "@/components/ui/misc";

export function ProductForm() {
  const [pending, startTransition] = useTransition();

  return (
    <Section title="Cadastrar / atualizar produto">
      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await upsertProduct(fd);
            toast.success("Produto salvo");
          });
        }}
      >
        <div>
          <Label>Nome</Label>
          <Input name="name" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Categoria</Label>
            <Input name="category" />
          </div>
          <div>
            <Label>Fornecedor</Label>
            <Input name="supplier" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Compra</Label>
            <Input name="purchasePrice" type="number" step="0.01" />
          </div>
          <div>
            <Label>Venda</Label>
            <Input name="salePrice" type="number" step="0.01" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Qtd</Label>
            <Input name="quantity" type="number" step="0.1" />
          </div>
          <div>
            <Label>Mín</Label>
            <Input name="minQuantity" type="number" step="0.1" />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input name="unit" defaultValue="un" />
          </div>
        </div>
        <div>
          <Label>Código</Label>
          <Input name="code" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Salvar produto
        </Button>
      </form>
    </Section>
  );
}
