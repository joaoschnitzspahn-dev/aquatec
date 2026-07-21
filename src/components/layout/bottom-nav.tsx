"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Hoje", icon: Home },
  { href: "/schedule", label: "Agenda", icon: CalendarDays },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/more", label: "Mais", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.5rem+var(--safe-bottom))]"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[480px] items-center justify-between rounded-[28px] border border-[var(--border)] bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] px-2 py-2 shadow-xl shadow-black/20 backdrop-blur-xl">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                active
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "text-[var(--muted)]",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
