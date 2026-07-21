import { TopBar } from "@/components/layout/top-bar";
import { getVisit, listNotifications } from "@/lib/data/actions";
import { VisitFlow } from "@/components/visit/visit-flow";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getVisit(id);
  } catch (error) {
    console.error("getVisit failed", id, error);
    return (
      <>
        <TopBar title="Atendimento" />
        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-semibold">Não foi possível abrir este atendimento.</p>
          <p className="text-sm text-[var(--muted)]">
            Volte na agenda e toque novamente no horário.
          </p>
          <Button asChild className="w-full">
            <Link href="/schedule">Voltar para agenda</Link>
          </Button>
        </div>
      </>
    );
  }

  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Atendimento" unread={unread} />
      <VisitFlow data={data} />
    </>
  );
}
