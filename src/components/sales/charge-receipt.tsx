"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { AQUATEC_PIX } from "@/lib/pix";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type ChargeSale = {
  id: string;
  date: string;
  dueDate?: string;
  total: number;
  description?: string;
  pixPayload?: string;
  status?: string;
  client?: { name: string } | null;
  employee: { name: string };
  items: {
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
    deliveredAt?: string;
  }[];
};

export function ChargeReceipt({ sale }: { sale: ChargeSale }) {
  const [copied, setCopied] = useState(false);
  const pix = sale.pixPayload || "";

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pix);
      setCopied(true);
      toast.success("PIX copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          Relatório de produtos e serviços
        </p>
        <p className="mt-1 text-lg font-semibold">
          {sale.client?.name || "Cliente avulso"}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Emissão {formatDateTime(sale.date)} · por {sale.employee.name}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
          Itens
        </div>
        <div className="divide-y divide-[var(--border)]">
          {sale.items.map((it, i) => (
            <div key={`${it.name}-${i}`} className="px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{it.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {it.quantity} {it.unit || "un"} ·{" "}
                    {formatCurrency(it.unitPrice)}
                    {it.deliveredAt
                      ? ` · ${formatDate(it.deliveredAt)}`
                      : ""}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(it.total)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--brand-soft)] px-4 py-3">
          <span className="text-sm font-medium">Total a pagar</span>
          <span className="text-lg font-semibold text-[var(--brand)]">
            {formatCurrency(sale.total)}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-semibold">Pagamento via PIX</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <span className="text-[var(--muted)]">Chave PIX </span>
            <span className="font-medium">{AQUATEC_PIX.key}</span>
          </p>
          <p>
            <span className="text-[var(--muted)]">Valor </span>
            <span className="font-medium">{formatCurrency(sale.total)}</span>
          </p>
          <p>
            <span className="text-[var(--muted)]">Vencimento </span>
            <span className="font-medium">
              {sale.dueDate
                ? formatDate(sale.dueDate)
                : formatDate(sale.date)}
            </span>
          </p>
        </div>

        {pix ? (
          <>
            <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
              <QRCodeSVG value={pix} size={180} level="M" includeMargin />
            </div>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Escaneie no app do banco ou use o PIX Copia e Cola.
            </p>
            <div className="mt-3 break-all rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[10px] leading-relaxed text-[var(--muted)]">
              {pix}
            </div>
            <Button
              type="button"
              className="mt-3 w-full"
              variant="outline"
              onClick={() => void copyPix()}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado" : "Copiar PIX Copia e Cola"}
            </Button>
          </>
        ) : null}

        <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Importante: após o pagamento, envie o comprovante!
        </p>
      </div>
    </div>
  );
}
