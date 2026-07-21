import { TopBar } from "@/components/layout/top-bar";
import {
  listAppointments,
  listNotifications,
  getClientsForSelect,
  getEmployeesForSelect,
} from "@/lib/data/actions";
import { ScheduleView } from "@/components/visit/schedule-view";

export default async function SchedulePage() {
  const appointments = await listAppointments("calendar", new Date().toISOString());
  // also include surrounding months for navigation feel
  const prev = new Date();
  prev.setMonth(prev.getMonth() - 1);
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const [prevMonth, nextMonth] = await Promise.all([
    listAppointments("calendar", prev.toISOString()),
    listAppointments("calendar", next.toISOString()),
  ]);

  const byId = new Map(
    [...prevMonth, ...appointments, ...nextMonth].map((a) => [a.id, a]),
  );
  const merged = Array.from(byId.values());

  const clients = await getClientsForSelect();
  const employees = await getEmployeesForSelect();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Agenda" unread={unread} />
      <ScheduleView
        appointments={merged}
        clients={clients}
        employees={employees}
      />
    </>
  );
}
