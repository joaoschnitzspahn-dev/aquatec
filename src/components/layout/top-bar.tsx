"use client";

import Link from "next/link";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function TopBar({
  title,
  unread = 0,
}: {
  title?: string;
  unread?: number;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Aquatec
          </p>
          {title ? (
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications" aria-label="Notificações" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--danger)]" />
              ) : null}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
          </Button>
        </div>
      </div>
    </header>
  );
}
