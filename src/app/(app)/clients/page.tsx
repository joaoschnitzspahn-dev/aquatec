import Link from "next/link";
import { Plus, QrCode, Pencil } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { listClients, listNotifications } from "@/lib/data/actions";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { POOL_TYPE_LABELS } from "@/lib/data/types";
import { ClientsSearch } from "@/components/clients/clients-search";
import { redirect } from "next/navigation";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const clients = await listClients(q);
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  const canWrite = can(user, "clients:write");

  return (
    <>
      <TopBar title="Clientes" unread={unread} />
      <div className="space-y-4 animate-fade-up">
        {canWrite ? (
          <Button asChild className="w-full" size="lg">
            <Link href="/clients/new">
              <Plus className="h-5 w-5" />
              Adicionar cliente
            </Link>
          </Button>
        ) : null}

        <div className="flex gap-2">
          <div className="flex-1">
            <ClientsSearch initial={q} />
          </div>
          <Button variant="soft" size="icon" asChild>
            <Link href="/search?mode=qr" aria-label="QR Code">
              <QrCode className="h-5 w-5" />
            </Link>
          </Button>
          {canWrite ? (
            <Button size="icon" asChild>
              <Link href="/clients/new" aria-label="Novo cliente">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          ) : null}
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente"
            description={
              canWrite
                ? "Cadastre o primeiro cliente da operação."
                : "Nenhum cliente atribuído a você."
            }
          />
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <Link
                  href={`/clients/${client.id}`}
                  className="block transition active:opacity-90"
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
                    <Badge
                      tone={client.status === "ACTIVE" ? "success" : "default"}
                    >
                      {client.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </Link>
                {canWrite ? (
                  <div className="mt-3 flex gap-2">
                    <Button asChild variant="secondary" size="sm" className="flex-1">
                      <Link href={`/clients/${client.id}`}>Abrir</Link>
                    </Button>
                    <Button asChild variant="soft" size="sm" className="flex-1">
                      <Link href={`/clients/${client.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
