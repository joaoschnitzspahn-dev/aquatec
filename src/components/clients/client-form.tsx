"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertClient } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  SERVICE_FREQUENCY_LABELS,
  type Client,
  type ServiceFrequency,
  type User,
} from "@/lib/data/types";

const DAY_OPTIONS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
];

export function ClientForm({
  client,
  employees,
}: {
  client?: Client & { responsible?: User };
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [frequency, setFrequency] = useState<ServiceFrequency>(
    client?.serviceFrequency || "WEEKLY_1",
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    client?.serviceDays?.length ? client.serviceDays : ["seg"],
  );

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      if (frequency === "WEEKLY_1") return [day];
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
      }
      if (frequency === "WEEKLY_2") {
        return prev.length >= 2 ? [prev[1], day] : [...prev, day];
      }
      return [...prev, day];
    });
  }

  return (
    <form
      className="space-y-4 animate-fade-up"
      action={(fd) => {
        startTransition(async () => {
          fd.set("serviceDays", selectedDays.join(","));
          await upsertClient(fd);
          toast.success(client ? "Cliente atualizado" : "Cliente criado");
          router.push("/clients");
          router.refresh();
        });
      }}
    >
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <div>
        <Label>Nome</Label>
        <Input name="name" required defaultValue={client?.name} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Telefone</Label>
          <Input name="phone" defaultValue={client?.phone} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input name="whatsapp" defaultValue={client?.whatsapp} />
        </div>
      </div>
      <div>
        <Label>Endereço</Label>
        <Input name="address" required defaultValue={client?.address} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>Cidade</Label>
          <Input name="city" defaultValue={client?.city || "Penha"} />
        </div>
        <div>
          <Label>UF</Label>
          <Input name="state" defaultValue={client?.state || "SC"} />
        </div>
        <div>
          <Label>CEP</Label>
          <Input name="zipCode" defaultValue={client?.zipCode} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Latitude</Label>
          <Input
            name="latitude"
            type="number"
            step="any"
            defaultValue={client?.latitude}
          />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input
            name="longitude"
            type="number"
            step="any"
            defaultValue={client?.longitude}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Tipo da piscina</Label>
          <Select name="poolType" defaultValue={client?.poolType || "FIBRA"}>
            <option value="FIBRA">Fibra</option>
            <option value="VINIL">Vinil</option>
            <option value="ALVENARIA">Alvenaria</option>
          </Select>
        </div>
        <div>
          <Label>Volume (L)</Label>
          <Input
            name="volumeLiters"
            type="number"
            defaultValue={client?.volumeLiters}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <p className="text-sm font-semibold">Frequência e agenda</p>
        <div>
          <Label>Frequência do atendimento</Label>
          <Select
            name="serviceFrequency"
            value={frequency}
            onChange={(e) => {
              const next = e.target.value as ServiceFrequency;
              setFrequency(next);
              if (next === "WEEKLY_1") {
                setSelectedDays((d) => d.slice(0, 1));
              } else if (next === "WEEKLY_2" && selectedDays.length < 2) {
                setSelectedDays(["seg", "qui"]);
              }
            }}
          >
            {(Object.keys(SERVICE_FREQUENCY_LABELS) as ServiceFrequency[]).map(
              (key) => (
                <option key={key} value={key}>
                  {SERVICE_FREQUENCY_LABELS[key]}
                </option>
              ),
            )}
          </Select>
        </div>

        {frequency === "WEEKLY_1" || frequency === "WEEKLY_2" ? (
          <div>
            <Label>
              {frequency === "WEEKLY_1"
                ? "Dia da semana"
                : "Dias da semana (2)"}
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_OPTIONS.map((d) => {
                const active = selectedDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--brand)] text-white"
                        : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            {frequency === "BIWEEKLY"
              ? "Os atendimentos serão gerados a cada 15 dias a partir de amanhã."
              : "Os atendimentos serão gerados 1x por mês a partir de amanhã."}
          </p>
        )}

        <div>
          <Label>Horário preferencial</Label>
          <Input
            name="serviceTime"
            type="time"
            defaultValue={client?.serviceTime || "09:00"}
          />
        </div>

        <div>
          <Label>Funcionário responsável</Label>
          <Select
            name="responsibleId"
            defaultValue={client?.responsibleId}
            required
          >
            <option value="">Selecione</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] p-3 text-sm">
          <input
            type="checkbox"
            name="autoSchedule"
            defaultChecked={!client}
            className="mt-1 h-4 w-4 accent-[var(--brand)]"
          />
          <span>
            <span className="font-medium">Agendar automaticamente</span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              Gera a agenda futura conforme a frequência (e substitui
              agendamentos futuros ainda abertos deste cliente).
            </span>
          </span>
        </label>
      </div>

      <div>
        <Label>Status</Label>
        <Select name="status" defaultValue={client?.status || "ACTIVE"}>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </Select>
      </div>
      <div>
        <Label>Observações</Label>
        <Textarea name="notes" defaultValue={client?.notes} />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        Salvar
      </Button>
    </form>
  );
}
