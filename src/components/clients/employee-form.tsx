"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { upsertEmployee } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Section } from "@/components/ui/misc";

export function EmployeeForm() {
  const [pending, startTransition] = useTransition();

  return (
    <Section title="Novo funcionário">
      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await upsertEmployee(fd);
            toast.success("Funcionário salvo");
          });
        }}
      >
        <div>
          <Label>Nome</Label>
          <Input name="name" required />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input name="phone" />
        </div>
        <div>
          <Label>Senha</Label>
          <Input name="password" type="password" defaultValue="aquatec123" />
        </div>
        <div>
          <Label>Cargo</Label>
          <Select name="role" defaultValue="EMPLOYEE">
            <option value="EMPLOYEE">Funcionário</option>
            <option value="MASTER">Administrador</option>
            <option value="CUSTOM">Personalizado</option>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Salvar
        </Button>
      </form>
    </Section>
  );
}
