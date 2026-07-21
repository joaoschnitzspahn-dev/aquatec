import { TopBar } from "@/components/layout/top-bar";
import { EmptyState, Section } from "@/components/ui/misc";
import {
  getClientsForSelect,
  listNotifications,
  listSales,
} from "@/lib/data/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SaleForm } from "@/components/visit/sale-form";

export default async function SalesPage() {
  const sales = await listSales();
  const clients = await getClientsForSelect();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Vendas" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <SaleForm clients={clients} />
        <Section title="Histórico">
          <div className="space-y-2">
            {sales.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {s.description || s.type}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {s.client?.name || "Avulso"} · {s.employee.name} ·{" "}
                      {formatDate(s.date)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(s.total)}</p>
                </div>
              </div>
            ))}
            {sales.length === 0 ? <EmptyState title="Nenhuma venda" /> : null}
          </div>
        </Section>
      </div>
    </>
  );
}
