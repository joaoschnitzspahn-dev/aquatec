import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { ChargeReceipt } from "@/components/sales/charge-receipt";
import { getSale, listNotifications } from "@/lib/data/actions";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let sale;
  try {
    sale = await getSale(id);
  } catch {
    notFound();
  }

  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Recibo / PIX" unread={unread} />
      <div className="space-y-4">
        <Link
          href="/sales"
          className="relative z-10 inline-flex items-center gap-1.5 text-sm text-[var(--brand)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às cobranças
        </Link>
        <ChargeReceipt sale={sale} />
      </div>
    </>
  );
}
