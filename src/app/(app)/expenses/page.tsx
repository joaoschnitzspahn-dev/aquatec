import { TopBar } from "@/components/layout/top-bar";
import { EmptyState, Section } from "@/components/ui/misc";
import { listExpenses, listNotifications } from "@/lib/data/actions";
import { EXPENSE_LABELS } from "@/lib/data/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseForm } from "@/components/visit/expense-form";

export default async function ExpensesPage() {
  const expenses = await listExpenses();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Despesas" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <ExpenseForm />
        <Section title="Histórico">
          <div className="space-y-2">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.description}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {EXPENSE_LABELS[e.category]} · {e.employee.name} ·{" "}
                      {formatDate(e.date)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(e.amount)}</p>
                </div>
              </div>
            ))}
            {expenses.length === 0 ? (
              <EmptyState title="Nenhuma despesa" />
            ) : null}
          </div>
        </Section>
      </div>
    </>
  );
}
