"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { upsertClient } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Client, User } from "@/lib/data/types";

export function ClientForm({
  client,
  employees,
}: {
  client?: Client & { responsible?: User };
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 animate-fade-up"
      action={(fd) => {
        startTransition(async () => {
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
          <Input name="city" defaultValue={client?.city} />
        </div>
        <div>
          <Label>UF</Label>
          <Input name="state" defaultValue={client?.state} />
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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Dias (sep. vírgula)</Label>
          <Input
            name="serviceDays"
            placeholder="seg,qui"
            defaultValue={client?.serviceDays.join(",")}
          />
        </div>
        <div>
          <Label>Horário</Label>
          <Input name="serviceTime" type="time" defaultValue={client?.serviceTime} />
        </div>
      </div>
      <div>
        <Label>Funcionário responsável</Label>
        <Select name="responsibleId" defaultValue={client?.responsibleId}>
          <option value="">—</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
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
