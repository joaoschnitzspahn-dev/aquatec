import { TopBar } from "@/components/layout/top-bar";
import { ClientForm } from "@/components/clients/client-form";
import {
  getEmployeesForSelect,
  listNotifications,
} from "@/lib/data/actions";

export default async function NewClientPage() {
  const employees = await getEmployeesForSelect();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Novo cliente" unread={unread} />
      <ClientForm employees={employees} />
    </>
  );
}
