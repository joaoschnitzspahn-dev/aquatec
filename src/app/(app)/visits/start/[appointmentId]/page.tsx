import { redirect } from "next/navigation";
import { getOrCreateVisit } from "@/lib/data/actions";

export default async function StartVisitPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const data = await getOrCreateVisit(appointmentId);
  redirect(`/visits/${data.visit.id}`);
}
