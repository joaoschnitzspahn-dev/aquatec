import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import {
  getClientsForSelect,
  listNotifications,
  listProducts,
  listSales,
} from "@/lib/data/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChargeForm } from "@/components/sales/charge-form";

export default async function SalesPage() {
  const sales = await listSales();
  const clients = await getClientsForSelect();
  const products = await listProducts();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Cobranças" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="relative z-10">
            <Link href="/reports">Relatórios</Link>
          </Button>
        </div>

        <ChargeForm
          clients={clients}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            salePrice: p.salePrice,
          }))}
        />

        <Section title="Histórico de cobranças">
          <div className="space-y-2">
            {sales.map((s) => (
              <Link
                key={s.id}
                href={`/sales/${s.id}`}
                className="relative z-10 block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {s.client?.name || s.description || "Cobrança"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {s.items.length} item{s.items.length !== 1 ? "s" : ""} ·{" "}
                      {s.employee.name} · {formatDate(s.date)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--brand)]">
                      Abrir recibo / PIX →
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(s.total)}</p>
                    <Badge
                      tone={s.status === "PAID" ? "success" : "brand"}
                      className="mt-1"
                    >
                      {s.status === "PAID" ? "Pago" : "Aberto"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
            {sales.length === 0 ? (
              <EmptyState title="Nenhuma cobrança ainda" />
            ) : null}
          </div>
        </Section>
      </div>
    </>
  );
}
