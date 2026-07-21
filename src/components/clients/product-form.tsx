"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { upsertProduct } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge, Section } from "@/components/ui/misc";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/data/types";

export function ProductForm({
  product,
  onDone,
}: {
  product?: Product;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
      action={(fd) => {
        startTransition(async () => {
          await upsertProduct(fd);
          toast.success(product ? "Produto atualizado" : "Produto cadastrado");
          onDone?.();
        });
      }}
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div>
        <Label>Nome</Label>
        <Input name="name" required defaultValue={product?.name} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Categoria</Label>
          <Input name="category" defaultValue={product?.category} />
        </div>
        <div>
          <Label>Fornecedor</Label>
          <Input name="supplier" defaultValue={product?.supplier} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Compra</Label>
          <Input
            name="purchasePrice"
            type="number"
            step="0.01"
            defaultValue={product?.purchasePrice ?? 0}
          />
        </div>
        <div>
          <Label>Venda</Label>
          <Input
            name="salePrice"
            type="number"
            step="0.01"
            defaultValue={product?.salePrice ?? 0}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>Qtd</Label>
          <Input
            name="quantity"
            type="number"
            step="0.1"
            defaultValue={product?.quantity ?? 0}
          />
        </div>
        <div>
          <Label>Mín</Label>
          <Input
            name="minQuantity"
            type="number"
            step="0.1"
            defaultValue={product?.minQuantity ?? 0}
          />
        </div>
        <div>
          <Label>Unidade</Label>
          <Input name="unit" defaultValue={product?.unit || "un"} />
        </div>
      </div>
      <div>
        <Label>Código</Label>
        <Input name="code" defaultValue={product?.code} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {product ? "Salvar alterações" : "Cadastrar produto"}
      </Button>
    </form>
  );
}

export function StockManager({
  products,
  canWrite = true,
}: {
  products: Product[];
  canWrite?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const editing = products.find((p) => p.id === editingId);

  return (
    <div className="space-y-4">
      {canWrite ? (
        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={() => {
            setShowCreate((v) => !v);
            setEditingId(null);
          }}
        >
          {showCreate ? "Fechar cadastro" : "Adicionar produto"}
        </Button>
      ) : null}

      {canWrite && showCreate ? (
        <Section title="Novo produto">
          <ProductForm
            onDone={() => {
              setShowCreate(false);
              window.location.reload();
            }}
          />
        </Section>
      ) : null}

      <Section title="Produtos do estoque">
        <div className="space-y-2">
          {products.map((p) => {
            const low = p.quantity <= p.minQuantity;
            return (
              <div
                key={p.id}
                className={`rounded-3xl border p-4 ${
                  low
                    ? "border-rose-500/40 bg-rose-500/10"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {[p.category, p.supplier, p.code]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Compra {formatCurrency(p.purchasePrice)} · Venda{" "}
                      {formatCurrency(p.salePrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {p.quantity} {p.unit}
                    </p>
                    {low ? <Badge tone="danger">Baixo</Badge> : null}
                  </div>
                </div>
                {canWrite ? (
                  <>
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        setEditingId(editingId === p.id ? null : p.id);
                        setShowCreate(false);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      {editingId === p.id
                        ? "Fechar"
                        : "Editar estoque / produto"}
                    </Button>
                    {editingId === p.id && editing ? (
                      <div className="mt-3">
                        <ProductForm
                          product={editing}
                          onDone={() => {
                            setEditingId(null);
                            window.location.reload();
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
          {products.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nenhum produto ainda.</p>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
