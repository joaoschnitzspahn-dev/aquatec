import { redirect } from "next/navigation";
import { getOrCreateVisit } from "@/lib/data/actions";
import { getVisitIdForAppointment } from "@/lib/data/persist";

export default async function StartVisitPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;

  try {
    const data = await getOrCreateVisit(appointmentId);
    redirect(`/visits/${data.visit.id}`);
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    // redirect() do Next.js lança — precisa propagar
    if (digest?.startsWith("NEXT_REDIRECT")) throw error;

    console.error("Falha ao abrir atendimento", appointmentId, error);
    // fallback: tenta rota determinística
    try {
      redirect(`/visits/${getVisitIdForAppointment(appointmentId)}`);
    } catch (e2) {
      const d2 = (e2 as { digest?: string })?.digest;
      if (d2?.startsWith("NEXT_REDIRECT")) throw e2;
      redirect("/schedule");
    }
  }
}
