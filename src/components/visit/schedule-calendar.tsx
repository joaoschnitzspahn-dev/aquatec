"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { STATUS_LABELS, type AppointmentStatus } from "@/lib/data/types";
import { formatDateTime } from "@/lib/utils";

export type CalendarAppointment = {
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  client: { name: string; address: string };
  employee: { name: string };
  visit?: { id: string } | null;
};

export function ScheduleCalendar({
  month,
  selected,
  appointments,
  onMonthChange,
  onSelectDay,
}: {
  month: Date;
  selected: Date;
  appointments: CalendarAppointment[];
  onMonthChange: (date: Date) => void;
  onSelectDay: (date: Date) => void;
}) {
  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }),
  });

  const countByDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.scheduledAt), day)).length;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(subMonths(month, 1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const count = countByDay(day);
          const selectedDay = isSameDay(day, selected);
          const inMonth = isSameMonth(day, month);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition active:scale-95",
                !inMonth && "opacity-35",
                selectedDay
                  ? "bg-[var(--brand)] font-semibold text-white"
                  : isToday(day)
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "hover:bg-[var(--surface-2)]",
              )}
            >
              {format(day, "d")}
              {count > 0 ? (
                <span
                  className={cn(
                    "mt-0.5 h-1 w-1 rounded-full",
                    selectedDay ? "bg-white" : "bg-[var(--brand)]",
                  )}
                />
              ) : (
                <span className="mt-0.5 h-1 w-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppointmentCard({ item }: { item: CalendarAppointment }) {
  const href = item.visit ? `/visits/${item.visit.id}` : `/visits/start/${item.id}`;

  return (
    <Link
      href={href}
      className="block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand)]/40 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{item.client.name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatDateTime(item.scheduledAt)}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">
            {item.client.address}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{item.employee.name}</p>
          <p className="mt-2 text-xs font-medium text-[var(--brand)]">
            Toque para abrir →
          </p>
        </div>
        <Badge
          tone={
            item.status === "COMPLETED"
              ? "success"
              : item.status === "LATE"
                ? "danger"
                : "brand"
          }
        >
          {STATUS_LABELS[item.status]}
        </Badge>
      </div>
    </Link>
  );
}
