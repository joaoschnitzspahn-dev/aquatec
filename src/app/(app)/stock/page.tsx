import { TopBar } from "@/components/layout/top-bar";
import { listNotifications, listProducts } from "@/lib/data/actions";
import { StockManager } from "@/components/clients/product-form";
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
  const canWrite = can(user, "stock:write");

  return (
    <>
      <TopBar title="Estoque geral" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <p className="text-sm text-[var(--muted)]">
          Controle de produtos da empresa
          {canWrite ? " — cadastre, edite quantidades e preços." : "."}
        </p>

        {canWrite ? (
          <StockManager products={products} canWrite />
        ) : (
          <StockManager products={products} canWrite={false} />
        )}
      </div>
    </>
  );
}
