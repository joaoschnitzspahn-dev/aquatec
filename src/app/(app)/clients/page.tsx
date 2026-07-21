import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { listClients, listNotifications } from "@/lib/data/actions";
import { POOL_TYPE_LABELS } from "@/lib/data/types";
import { ClientsSearch } from "@/components/clients/clients-search";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clients = await listClients(q);
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <TopBar title="Clientes" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        <div className="flex gap-2">
          <div className="flex-1">
            <ClientsSearch initial={q} />
          </div>
          <Button variant="soft" size="icon" asChild>
            <Link href="/search?mode=qr" aria-label="QR Code">
              <QrCode className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="icon" asChild>
            <Link href="/clients/new" aria-label="Novo cliente">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente"
            description="Cadastre o primeiro cliente da operação."
          />
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {client.address}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {POOL_TYPE_LABELS[client.poolType]}
                      {client.serviceTime ? ` · ${client.serviceTime}` : ""}
                    </p>
                  </div>
                  <Badge tone={client.status === "ACTIVE" ? "success" : "default"}>
                    {client.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
