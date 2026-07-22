"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, FileDown } from "lucide-react";
import { toast } from "sonner";
import { AQUATEC_PIX } from "@/lib/pix";
import { generateChargePdf } from "@/lib/pdf/charge-report";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/utils";

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
  const [pdfBusy, setPdfBusy] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const pix = sale.pixPayload || "";
  const clientName = sale.client?.name || "Cliente avulso";
  const due = sale.dueDate ? formatDate(sale.dueDate) : formatDate(sale.date);

  async function copyPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix);
      setCopied(true);
      toast.success(`PIX copiado · ${formatCurrency(sale.total)}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function downloadPdf() {
    setPdfBusy(true);
    try {
      const qrDataUrl = qrRef.current?.toDataURL("image/png");
      generateChargePdf({
        clientName,
        employeeName: sale.employee.name,
        issuedAt: sale.date,
        dueDate: sale.dueDate || sale.date,
        total: sale.total,
        pixPayload: pix || undefined,
        qrDataUrl,
        items: sale.items,
      });
      toast.success("PDF gerado");
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          Relatório de produtos e serviços
        </p>
        <p className="mt-1 text-lg font-semibold">{clientName}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Data de emissão {formatDate(sale.date)} · Hora {formatTime(sale.date)}{" "}
          · Emitido por {sale.employee.name}
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Demonstrativo geral e atual de produtos e serviços
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr] gap-2 border-b border-[var(--border)] bg-[var(--brand)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white sm:grid-cols-[1.6fr_0.5fr_0.5fr_0.7fr_0.7fr_0.7fr]">
          <span>Produto</span>
          <span className="hidden sm:inline">Tipo</span>
          <span>Qtd</span>
          <span className="hidden sm:inline">Entrega</span>
          <span className="hidden text-right sm:inline">Unit.</span>
          <span className="text-right">Total</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {sale.items.map((it, i) => (
            <div
              key={`${it.name}-${i}`}
              className="grid grid-cols-[1.4fr_0.7fr_0.8fr] gap-2 px-3 py-3 text-sm sm:grid-cols-[1.6fr_0.5fr_0.5fr_0.7fr_0.7fr_0.7fr]"
            >
              <div>
                <p className="font-medium leading-snug">{it.name}</p>
                <p className="mt-0.5 text-[10px] text-[var(--muted)] sm:hidden">
                  {it.unit || "un"} · {formatCurrency(it.unitPrice)} ·{" "}
                  {it.deliveredAt
                    ? formatDate(it.deliveredAt)
                    : formatDate(sale.date)}
                </p>
              </div>
              <span className="hidden text-xs text-[var(--muted)] sm:inline">
                {it.unit || "un"}
              </span>
              <span className="text-xs">{it.quantity}</span>
              <span className="hidden text-xs text-[var(--muted)] sm:inline">
                {it.deliveredAt
                  ? formatDate(it.deliveredAt)
                  : formatDate(sale.date)}
              </span>
              <span className="hidden text-right text-xs sm:inline">
                {formatCurrency(it.unitPrice)}
              </span>
              <span className="text-right font-semibold">
                {formatCurrency(it.total)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--brand-soft)] px-4 py-3">
          <span className="text-sm font-medium">Total à pagar</span>
          <span className="text-lg font-semibold text-[var(--brand)]">
            {formatCurrency(sale.total)}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-semibold uppercase tracking-wide">
          Pagamento via PIX
        </p>
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
            <span className="font-medium">{due}</span>
          </p>
        </div>

        {pix ? (
          <>
            <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
              <QRCodeCanvas
                ref={qrRef}
                value={pix}
                size={180}
                level="M"
                includeMargin
              />
            </div>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Escaneie para pagar — ou use o PIX Copia e Cola abaixo.
            </p>
            <div className="mt-3 break-all rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[10px] leading-relaxed text-[var(--muted)]">
              {pix}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => void copyPix()}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied
                  ? "Código copiado"
                  : `Copiar PIX · ${formatCurrency(sale.total)}`}
              </Button>
              <Button
                type="button"
                className="w-full"
                variant="outline"
                disabled={pdfBusy}
                onClick={() => void downloadPdf()}
              >
                <FileDown className="h-4 w-4" />
                {pdfBusy ? "Gerando PDF…" : "Baixar PDF da cobrança"}
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            className="mt-3 w-full"
            variant="outline"
            disabled={pdfBusy}
            onClick={() => void downloadPdf()}
          >
            <FileDown className="h-4 w-4" />
            {pdfBusy ? "Gerando PDF…" : "Baixar PDF da cobrança"}
          </Button>
        )}

        <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Importante: após o pagamento, envie o comprovante!
        </p>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          Emitido em {formatDateTime(sale.date)}
        </p>
      </div>
    </div>
  );
}
