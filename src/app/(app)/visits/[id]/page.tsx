import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getVisit, listNotifications } from "@/lib/data/actions";
import { VisitFlow } from "@/components/visit/visit-flow";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getVisit(id);
  } catch {
    notFound();
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
