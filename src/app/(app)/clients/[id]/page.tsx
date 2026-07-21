import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Phone,
  MessageCircle,
  Pencil,
  Waves,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge, EmptyState, Section } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { getClient, listNotifications } from "@/lib/data/actions";
import {
  EQUIPMENT_LABELS,
  POOL_TYPE_LABELS,
} from "@/lib/data/types";
import {
  formatDateTime,
  googleMapsUrl,
  minutesToLabel,
  whatsappUrl,
  formatDistance,
} from "@/lib/utils";
import { ClientQr } from "@/components/clients/client-qr";
import { WaterChart } from "@/components/clients/water-chart";
import { ClientStockForm } from "@/components/clients/client-stock-form";
import { DeleteClientButton } from "@/components/clients/delete-client-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") return null;

  let data;
  try {
    data = await getClient(id);
  } catch {
    notFound();
  }

  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  const { client, stock, visits, appointments, equipment, readings, products, user } =
    data;

  const maps =
    client.latitude && client.longitude
      ? googleMapsUrl(client.latitude, client.longitude)
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address)}`;

  const wa = client.whatsapp
    ? whatsappUrl(
        client.whatsapp,
        `Olá ${client.name}, aqui é da Aquatec. Seguimos com a manutenção da sua piscina.`,
      )
    : null;

  return (
    <>
      <TopBar title={client.name} unread={unread} />
      <div className="space-y-5 animate-fade-up">
        <div className="flex flex-wrap gap-2">
          <Badge tone={client.status === "ACTIVE" ? "success" : "default"}>
            {client.status === "ACTIVE" ? "Ativo" : "Inativo"}
          </Badge>
          <Badge tone="brand">{POOL_TYPE_LABELS[client.poolType]}</Badge>
          {client.volumeLiters ? (
            <Badge>{client.volumeLiters.toLocaleString("pt-BR")} L</Badge>
          ) : null}
        </div>

        {user.role === "MASTER" ? (
          <Button asChild className="w-full" size="lg">
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="h-5 w-5" />
              Editar cliente
            </Link>
          </Button>
        ) : null}

        <Section title="Informações">
          <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
            <p className="flex gap-2 text-[var(--muted)]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {client.address}
            </p>
            {client.phone ? (
              <p className="flex gap-2 text-[var(--muted)]">
                <Phone className="h-4 w-4" />
                {client.phone}
              </p>
            ) : null}
            {client.responsible ? (
              <p className="text-[var(--muted)]">
                Responsável: {client.responsible.name}
              </p>
            ) : null}
            {client.notes ? (
              <p className="rounded-2xl bg-[var(--surface-2)] p-3">{client.notes}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="secondary" size="sm">
                <a href={maps} target="_blank" rel="noreferrer">
                  Google Maps
                </a>
              </Button>
              {wa ? (
                <Button asChild variant="soft" size="sm">
                  <a href={wa} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </Section>

        <Section title="QR Code">
          <ClientQr token={client.qrCodeToken} name={client.name} />
        </Section>

        <Section title="Estoque do cliente">
          <div className="space-y-2">
            {stock.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-sm ${
                  s.quantity <= s.minQuantity
                    ? "border-rose-500/40 bg-rose-500/10"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div>
                  <p className="font-medium">{s.product.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Mín. {s.minQuantity} {s.unit}
                  </p>
                </div>
                <p className="font-semibold">
                  {s.quantity} {s.unit}
                </p>
              </div>
            ))}
            {stock.length === 0 ? (
              <EmptyState title="Sem estoque cadastrado" />
            ) : null}
          </div>
          {user.role === "MASTER" ? (
            <div className="mt-3">
              <ClientStockForm
                clientId={client.id}
                products={products.map((p) => ({
                  id: p.id,
                  name: p.name,
                  unit: p.unit,
                }))}
              />
            </div>
          ) : null}
        </Section>

        <Section title="Leituras da água">
          {readings.length > 0 ? (
            <WaterChart
              data={readings.map((r) => ({
                date: new Date(r.recordedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                }),
                ph: r.ph,
                chlorine: r.chlorine,
              }))}
            />
          ) : (
            <EmptyState title="Sem leituras ainda" />
          )}
        </Section>

        <Section title="Equipamentos">
          <div className="space-y-2">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-[var(--brand)]" />
                  <p className="font-medium">{EQUIPMENT_LABELS[eq.type]}</p>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[eq.brand, eq.model].filter(Boolean).join(" · ") || "—"}
                </p>
                {eq.maintenances[0] ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Última manutenção: {eq.maintenances[0].description}
                  </p>
                ) : null}
              </div>
            ))}
            {equipment.length === 0 ? (
              <EmptyState title="Nenhum equipamento" />
            ) : null}
          </div>
        </Section>

        <Section title="Agenda futura">
          {appointments.length === 0 ? (
            <EmptyState title="Sem agendamentos futuros" />
          ) : (
            <div className="space-y-2">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm"
                >
                  {formatDateTime(a.scheduledAt)}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Histórico">
          <div className="space-y-2">
            {visits.map((v) => (
              <Link
                key={v.id}
                href={`/visits/${v.id}`}
                className="block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {formatDateTime(v.startedAt || v.createdAt)}
                  </p>
                  <Badge
                    tone={
                      v.status === "COMPLETED"
                        ? "success"
                        : v.status === "STARTED"
                          ? "brand"
                          : "default"
                    }
                  >
                    {v.status === "STARTED"
                      ? "Em andamento"
                      : v.status === "COMPLETED"
                        ? "Concluído"
                        : v.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {v.employee.name}
                  {v.durationMinutes
                    ? ` · ${minutesToLabel(v.durationMinutes)}`
                    : ""}
                </p>
                {v.startLatitude != null && v.startLongitude != null ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    GPS início: {v.startLatitude.toFixed(5)},{" "}
                    {v.startLongitude.toFixed(5)}
                    {v.startDistanceMeters != null
                      ? ` · ${formatDistance(v.startDistanceMeters)}`
                      : ""}
                    {v.locationMismatch ? " · divergente" : ""}
                  </p>
                ) : null}
                {v.locationMismatch && user.role === "MASTER" ? (
                  <p className="mt-1 text-xs text-[var(--warning)]">
                    Local diferente do endereço —{" "}
                    <span className="underline">abrir Maps no atendimento</span>
                  </p>
                ) : null}
                {v.notes?.[0] ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {v.notes[0].content}
                  </p>
                ) : v.observations ? (
                  <p className="mt-2 text-sm">{v.observations}</p>
                ) : null}
              </Link>
            ))}
            {visits.length === 0 ? (
              <EmptyState title="Sem atendimentos" />
            ) : null}
          </div>
        </Section>

        <Section title="Fotos">
          <div className="grid grid-cols-2 gap-2">
            {data.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt={p.caption || p.type}
                className="aspect-square rounded-2xl border border-[var(--border)] object-cover"
              />
            ))}
          </div>
          {data.photos.length === 0 ? (
            <EmptyState title="Sem fotos" />
          ) : null}
        </Section>

        {user.role === "MASTER" ? (
          <DeleteClientButton clientId={client.id} />
        ) : null}
      </div>
    </>
  );
}
