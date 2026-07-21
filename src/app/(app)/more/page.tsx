import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  FileText,
  Receipt,
  Search,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { LogoutButton } from "@/components/layout/logout-button";
import { getSessionUser } from "@/lib/auth/session";
import { can, roleLabel } from "@/lib/auth/permissions";
import { listNotifications } from "@/lib/data/actions";
import { redirect } from "next/navigation";

const links = [
  { href: "/clients/new", label: "Adicionar cliente", icon: Users, perm: "clients:write" as const, masterOnly: true },
  { href: "/stock", label: "Estoque e produtos", icon: Boxes, perm: "stock:read" as const },
  { href: "/search", label: "Busca global", icon: Search, perm: null },
  { href: "/employees", label: "Funcionários", icon: Users, perm: "employees:read" as const },
  { href: "/reports", label: "Relatórios / KPIs", icon: FileText, perm: "reports:read" as const },
  { href: "/expenses", label: "Despesas", icon: Receipt, perm: null },
  { href: "/sales", label: "Financeiro / Vendas", icon: Wallet, perm: "finance:read" as const },
  { href: "/audit", label: "Auditoria", icon: Shield, perm: "audit:read" as const },
  { href: "/notifications", label: "Notificações", icon: ClipboardList, perm: null },
];

export default async function MorePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  const visible = links.filter((l) => {
    if (l.masterOnly && user.role !== "MASTER") return false;
    return !l.perm || can(user, l.perm);
  });

  return (
    <>
      <TopBar title="Mais" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-[var(--brand)]">
            {roleLabel(user.role)}
          </p>
        </div>

        <div className="space-y-2">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 transition active:scale-[0.99]"
              >
                <Icon className="h-5 w-5 text-[var(--brand)]" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <LogoutButton />
      </div>
    </>
  );
}
