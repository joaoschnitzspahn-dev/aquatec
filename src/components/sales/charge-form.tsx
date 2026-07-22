"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createSale } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Line = {
  key: string;
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

export function ChargeForm({
  clients,
  products,
}: {
  clients: { id: string; name: string }[];
  products: {
    id: string;
    name: string;
    unit: string;
    salePrice: number;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [lines, setLines] = useState<Line[]>([
    {
      key: "1",
      productId: products[0]?.id || "",
      name: products[0]?.name || "",
      unit: products[0]?.unit || "un",
      quantity: 1,
      unitPrice: products[0]?.salePrice || 0,
    },
  ]);

  const total = useMemo(
    () =>
      Number(
        lines
          .reduce((acc, l) => acc + l.quantity * l.unitPrice, 0)
          .toFixed(2),
      ),
    [lines],
  );

  function addLine() {
    const p = products[0];
    setLines((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        productId: p?.id || "",
        name: p?.name || "",
        unit: p?.unit || "un",
        quantity: 1,
        unitPrice: p?.salePrice || 0,
      },
    ]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  function pickProduct(key: string, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateLine(key, {
      productId: p.id,
      name: p.name,
      unit: p.unit,
      unitPrice: p.salePrice,
    });
  }

  return (
    <form
      className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
      action={(fd) => {
        startTransition(async () => {
          fd.set("clientId", clientId);
          fd.set("type", "PRODUCT");
          fd.set(
            "itemsJson",
            JSON.stringify(
              lines.map((l) => ({
                productId: l.productId || undefined,
                name: l.name,
                unit: l.unit,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                deliveredAt: new Date().toISOString(),
              })),
            ),
          );
          const res = await createSale(fd);
          if (res.error) {
            toast.error(res.error);
            return;
          }
          toast.success("Cobrança gerada");
          if (res.id) router.push(`/sales/${res.id}`);
          else router.refresh();
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold">Gerar cobrança</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Relatório de produtos com PIX (chave Aquatec).
        </p>
      </div>

      <div>
        <Label>Cliente</Label>
        <Select
          name="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Vencimento</Label>
        <Input
          name="dueDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="mb-0">Produtos / serviços</Label>
          <Button type="button" size="sm" variant="outline" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Item
          </Button>
        </div>

        {lines.map((line) => (
          <div
            key={line.key}
            className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
          >
            <div>
              <Label>Produto</Label>
              <Select
                value={line.productId}
                onChange={(e) => pickProduct(line.key, e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatCurrency(p.salePrice)}/{p.unit}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Qtd</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.key, {
                      quantity: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  value={line.unit}
                  onChange={(e) =>
                    updateLine(line.key, { unit: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) =>
                    updateLine(line.key, {
                      unitPrice: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">
                Subtotal {formatCurrency(line.quantity * line.unitPrice)}
              </span>
              {lines.length > 1 ? (
                <button
                  type="button"
                  className="text-[var(--danger)]"
                  onClick={() =>
                    setLines((prev) => prev.filter((l) => l.key !== line.key))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] px-4 py-3">
        <p className="text-xs text-[var(--muted)]">Total a pagar</p>
        <p className="text-2xl font-semibold text-[var(--brand)]">
          {formatCurrency(total)}
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Gerando…" : "Gerar cobrança PIX"}
      </Button>
    </form>
  );
}
