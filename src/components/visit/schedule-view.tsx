"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AppointmentCard,
  ScheduleCalendar,
  type CalendarAppointment,
} from "@/components/visit/schedule-calendar";
import { AppointmentForm } from "@/components/visit/appointment-form";
import { EmptyState, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export function ScheduleView({
  appointments,
  clients,
  employees,
}: {
  appointments: CalendarAppointment[];
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
}) {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [mode, setMode] = useState<"calendar" | "list">("calendar");

  const dayItems = useMemo(
    () =>
      appointments.filter((a) =>
        isSameDay(parseISO(a.scheduledAt), selected),
      ),
    [appointments, selected],
  );

  const upcoming = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return appointments.filter((a) => {
      const d = new Date(a.scheduledAt);
      return d >= start && d < end;
    });
  }, [appointments]);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "calendar" ? "default" : "secondary"}
          onClick={() => setMode("calendar")}
        >
          Calendário
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "list" ? "default" : "secondary"}
          onClick={() => setMode("list")}
        >
          Lista (7 dias)
        </Button>
      </div>

      {mode === "calendar" ? (
        <>
          <ScheduleCalendar
            month={month}
            selected={selected}
            appointments={appointments}
            onMonthChange={setMonth}
            onSelectDay={setSelected}
          />

          <Section
            title={`Dia ${format(selected, "d 'de' MMMM", { locale: ptBR })}`}
          >
            <div className="space-y-2">
              {dayItems.map((item) => (
                <AppointmentCard key={item.id} item={item} />
              ))}
              {dayItems.length === 0 ? (
                <EmptyState
                  title="Nenhum agendamento neste dia"
                  description="Toque em outro dia no calendário ou crie um novo."
                />
              ) : null}
            </div>
          </Section>
        </>
      ) : (
        <Section title="Próximos 7 dias">
          <div className="space-y-2">
            {upcoming.map((item) => (
              <AppointmentCard key={item.id} item={item} />
            ))}
            {upcoming.length === 0 ? (
              <EmptyState title="Sem agendamentos na semana" />
            ) : null}
          </div>
        </Section>
      )}

      <AppointmentForm clients={clients} employees={employees} />
    </div>
  );
}
