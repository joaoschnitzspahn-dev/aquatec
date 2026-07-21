import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { ClientForm } from "@/components/clients/client-form";
import {
  getClient,
  getEmployeesForSelect,
  listNotifications,
} from "@/lib/data/actions";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getClient(id);
  } catch {
    notFound();
  }
  const employees = await getEmployeesForSelect();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Editar cliente" unread={unread} />
      <ClientForm client={data.client} employees={employees} />
    </>
  );
}
