"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { upsertAppointment } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Section } from "@/components/ui/misc";

export function AppointmentForm({
  clients,
  employees,
}: {
  clients: { id: string; name: string }[];
  employees: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Section title="Novo agendamento">
      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await upsertAppointment(fd);
            toast.success("Agendamento criado");
          });
        }}
      >
        <div>
          <Label>Cliente</Label>
          <Select name="clientId" required>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Funcionário</Label>
          <Select name="employeeId" required>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Data e hora</Label>
          <Input name="scheduledAt" type="datetime-local" required />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Agendar
        </Button>
      </form>
    </Section>
  );
}
