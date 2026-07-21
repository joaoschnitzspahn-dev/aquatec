import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { listNotifications, listProducts } from "@/lib/data/actions";
import { formatCurrency } from "@/lib/utils";
import { ProductForm } from "@/components/clients/product-form";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export default async function StockPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can(user, "stock:read")) redirect("/dashboard");

  const products = await listProducts();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Estoque geral" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <Section title="Produtos">
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
                        {[p.category, p.supplier, p.code].filter(Boolean).join(" · ")}
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
                </div>
              );
            })}
            {products.length === 0 ? (
              <EmptyState title="Nenhum produto" />
            ) : null}
          </div>
        </Section>

        {can(user, "stock:write") ? <ProductForm /> : null}
      </div>
    </>
  );
}
