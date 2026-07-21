import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { listEmployees, listNotifications } from "@/lib/data/actions";
import { roleLabel } from "@/lib/auth/permissions";
import { EmployeeForm } from "@/components/clients/employee-form";
import { DeleteEmployeeButton } from "@/components/clients/delete-employee-button";

export default async function EmployeesPage() {
  const employees = await listEmployees();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Funcionários" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <Section title="Equipe">
          <div className="space-y-2">
            {employees.map((e) => (
              <div
                key={e.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-sm text-[var(--muted)]">{e.email}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge tone="brand">{roleLabel(e.role)}</Badge>
                      <Badge tone={e.isOnline ? "success" : "default"}>
                        {e.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                  <DeleteEmployeeButton employeeId={e.id} />
                </div>
              </div>
            ))}
            {employees.length === 0 ? (
              <EmptyState title="Nenhum funcionário" />
            ) : null}
          </div>
        </Section>
        <EmployeeForm />
      </div>
    </>
  );
}
