"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addClientWaterReading,
  deleteEquipment,
  upsertAppointment,
  upsertEquipment,
  updateClientStock,
} from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EQUIPMENT_LABELS, type EquipmentType } from "@/lib/data/types";

export function MasterClientEditors({
  clientId,
  products,
  employees,
  stock,
}: {
  clientId: string;
  products: { id: string; name: string; unit: string }[];
  employees: { id: string; name: string }[];
  stock: {
    productId: string;
    quantity: number;
    minQuantity: number;
    product: { name: string };
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh(msg: string) {
    toast.success(msg);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] p-4">
        <p className="text-sm font-semibold text-[var(--brand)]">
          Painel Master — editar ficha
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Estoque, leituras, equipamentos e agenda deste cliente.
        </p>
      </div>

      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await updateClientStock(fd);
            refresh("Estoque do cliente salvo");
          });
        }}
      >
        <p className="text-sm font-semibold">Estoque do cliente</p>
        <input type="hidden" name="clientId" value={clientId} />
        <div>
          <Label>Produto</Label>
          <Select name="productId" required defaultValue={stock[0]?.productId}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {stock.some((s) => s.productId === p.id)
                  ? ` (atual: ${stock.find((s) => s.productId === p.id)?.quantity})`
                  : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Quantidade</Label>
            <Input name="quantity" type="number" step="0.1" required />
          </div>
          <div>
            <Label>Mínimo</Label>
            <Input name="minQuantity" type="number" step="0.1" defaultValue={1} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Salvar estoque
        </Button>
      </form>

      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await addClientWaterReading(fd);
            refresh("Leitura registrada");
          });
        }}
      >
        <p className="text-sm font-semibold">Nova leitura da água</p>
        <input type="hidden" name="clientId" value={clientId} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>pH</Label>
            <Input name="ph" type="number" step="0.1" />
          </div>
          <div>
            <Label>Cloro</Label>
            <Input name="chlorine" type="number" step="0.1" />
          </div>
          <div>
            <Label>Alcalinidade</Label>
            <Input name="alkalinity" type="number" step="1" />
          </div>
          <div>
            <Label>Temperatura</Label>
            <Input name="temperature" type="number" step="0.1" />
          </div>
        </div>
        <div>
          <Label>Observação</Label>
          <Input name="notes" placeholder="Opcional" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Salvar leitura
        </Button>
      </form>

      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await upsertEquipment(fd);
            refresh("Equipamento salvo");
          });
        }}
      >
        <p className="text-sm font-semibold">Adicionar equipamento</p>
        <input type="hidden" name="clientId" value={clientId} />
        <div>
          <Label>Tipo</Label>
          <Select name="type" defaultValue="PUMP">
            {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map((key) => (
              <option key={key} value={key}>
                {EQUIPMENT_LABELS[key]}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Marca</Label>
            <Input name="brand" />
          </div>
          <div>
            <Label>Modelo</Label>
            <Input name="model" />
          </div>
        </div>
        <div>
          <Label>Nº de série</Label>
          <Input name="serialNumber" />
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea name="notes" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Salvar equipamento
        </Button>
      </form>

      <form
        className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
        action={(fd) => {
          startTransition(async () => {
            await upsertAppointment(fd);
            refresh("Agendamento criado");
          });
        }}
      >
        <p className="text-sm font-semibold">Agendar atendimento</p>
        <input type="hidden" name="clientId" value={clientId} />
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
        <div>
          <Label>Observações</Label>
          <Input name="notes" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          Salvar na agenda
        </Button>
      </form>
    </div>
  );
}

export function DeleteEquipmentButton({
  equipmentId,
  clientId,
}: {
  equipmentId: string;
  clientId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      className="text-[var(--danger)]"
      onClick={() => {
        if (!confirm("Excluir equipamento?")) return;
        startTransition(async () => {
          await deleteEquipment(equipmentId, clientId);
          toast.success("Equipamento removido");
          router.refresh();
        });
      }}
    >
      Excluir
    </Button>
  );
}
