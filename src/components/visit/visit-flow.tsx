"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
import {
  addProductUsage,
  addVisitNote,
  finishVisit,
  saveWaterReading,
  startVisit,
  toggleChecklist,
} from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge, Section } from "@/components/ui/misc";
import { formatDateTime, minutesToLabel, whatsappUrl, googleMapsUrl, formatDistance } from "@/lib/utils";
import { generateVisitPdf } from "@/lib/pdf/visit-report";
import { getQuickGeo, warmGps } from "@/lib/geo";
import type { getVisit } from "@/lib/data/actions";

type VisitData = Awaited<ReturnType<typeof getVisit>>;

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getGeo(): Promise<{ latitude?: number; longitude?: number }> {
  warmGps();
  const geo = await getQuickGeo();
  if (!geo) return {};
  return { latitude: geo.latitude, longitude: geo.longitude };
}

export function VisitFlow({ data }: { data: VisitData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    warmGps();
  }, []);
  const [arrivalPhoto, setArrivalPhoto] = useState<string>("");
  const [finalPhoto, setFinalPhoto] = useState<string>("");
  const [companyConfirm, setCompanyConfirm] = useState<{
    productId: string;
    quantity: number;
  } | null>(null);
  const sigRef = useRef<SignatureCanvas>(null);

  const checkedCount = data.checklist.filter((c) => c.response?.checked).length;
  const requiredOk = data.checklist
    .filter((c) => c.required)
    .every((c) => c.response?.checked);

  const duration = useMemo(() => {
    if (data.visit.startedAt && data.visit.finishedAt) {
      return data.visit.durationMinutes || 0;
    }
    if (data.visit.startedAt) {
      return Math.round(
        (Date.now() - new Date(data.visit.startedAt).getTime()) / 60000,
      );
    }
    return 0;
  }, [data.visit]);

  const step =
    data.visit.status === "COMPLETED"
      ? 4
      : data.visit.status === "STARTED"
        ? 2
        : 1;

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{data.client.name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {data.client.address}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {data.employee.name}
              {data.visit.startedAt
                ? ` · início ${formatDateTime(data.visit.startedAt)}`
                : ""}
            </p>
            {data.visit.startLatitude != null &&
            data.visit.startLongitude != null ? (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-[var(--muted)]">
                  GPS chegada: {data.visit.startLatitude.toFixed(5)},{" "}
                  {data.visit.startLongitude.toFixed(5)}
                  {data.visit.startDistanceMeters != null
                    ? ` · ${formatDistance(data.visit.startDistanceMeters)} do endereço`
                    : ""}
                  {data.visit.locationMismatch ? " · divergente" : ""}
                </p>
                <a
                  href={googleMapsUrl(
                    data.visit.startLatitude,
                    data.visit.startLongitude,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-[var(--brand)]"
                >
                  Ver local real no Maps →
                </a>
              </div>
            ) : data.visit.gpsUnavailable ? (
              <p className="mt-2 text-xs text-[var(--warning)]">
                Chegada sem GPS — Master pode revisar no histórico.
              </p>
            ) : null}
            {data.visit.locationMismatch ? (
              <div className="mt-2 rounded-2xl border border-[var(--warning)]/40 bg-amber-500/10 px-3 py-2 text-xs text-[var(--warning)]">
                Localização diferente do endereço do cliente. Atendimento
                liberado; coordenada registrada para o Master.
              </div>
            ) : null}
          </div>
          <Badge
            tone={
              data.visit.status === "COMPLETED"
                ? "success"
                : data.visit.status === "STARTED"
                  ? "brand"
                  : "default"
            }
          >
            {data.visit.status}
          </Badge>
        </div>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                step >= s ? "bg-[var(--brand)]" : "bg-[var(--surface-2)]"
              }`}
            />
          ))}
        </div>
      </div>

      {data.visit.status === "PENDING" || data.visit.status === "STARTED" ? (
        <>
          {data.visit.status === "PENDING" ? (
            <Section title="Iniciar atendimento">
              <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--muted)]">
                  Foto de chegada obrigatória. O GPS é registrado automaticamente
                  — se não bater com o endereço, o atendimento ainda é liberado e
                  a coordenada real fica no histórico para o Master.
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setArrivalPhoto(await fileToDataUrl(file));
                  }}
                />
                {arrivalPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={arrivalPhoto}
                    alt="Chegada"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                ) : null}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={pending || !arrivalPhoto}
                  onClick={() => {
                    startTransition(async () => {
                      toast.message("Obtendo GPS…");
                      const geo = await getGeo();
                      const fd = new FormData();
                      fd.set("visitId", data.visit.id);
                      if (data.visit.appointmentId) {
                        fd.set("appointmentId", data.visit.appointmentId);
                      }
                      fd.set("photoUrl", arrivalPhoto);
                      if (geo.latitude != null)
                        fd.set("latitude", String(geo.latitude));
                      if (geo.longitude != null)
                        fd.set("longitude", String(geo.longitude));
                      const res = await startVisit(fd);
                      if (res.error) {
                        toast.error(res.error);
                        return;
                      }
                      if (geo.latitude != null && geo.longitude != null) {
                        const { updateJourneyOrigin } = await import(
                          "@/components/dashboard/today-queue"
                        );
                        updateJourneyOrigin(geo.latitude, geo.longitude);
                      }
                      if (res.locationMismatch) {
                        toast.warning(
                          `GPS divergente (${formatDistance(res.distanceMeters || 0)}). Atendimento liberado — Master verá a coordenada.`,
                        );
                      } else if (res.gpsUnavailable) {
                        toast.warning(
                          "GPS indisponível. Atendimento liberado com foto.",
                        );
                      } else {
                        toast.success("Chegada registrada no histórico");
                      }
                      router.refresh();
                    });
                  }}
                >
                  Registrar chegada e iniciar
                </Button>
              </div>
            </Section>
          ) : null}

          {data.visit.status === "STARTED" ? (
            <>
              <Section
                title={`Checklist (${checkedCount}/${data.checklist.length})`}
              >
                <div className="grid gap-2">
                  {data.checklist.map((item) => {
                    const checked = Boolean(item.response?.checked);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          startTransition(async () => {
                            await toggleChecklist(data.visit.id, item.id);
                            router.refresh();
                          });
                        }}
                        className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.99] ${
                          checked
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        }`}
                      >
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md border border-current text-xs">
                          {checked ? "✓" : ""}
                        </span>
                        {item.label}
                        {item.required ? (
                          <span className="ml-2 text-[10px] uppercase opacity-70">
                            obrigatório
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Produtos utilizados">
                <form
                  className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  action={(fd) => {
                    startTransition(async () => {
                      fd.set("visitId", data.visit.id);
                      fd.set("source", "CLIENT");
                      const res = await addProductUsage(fd);
                      if (res.needsCompanyStock) {
                        setCompanyConfirm({
                          productId: String(fd.get("productId")),
                          quantity: Number(fd.get("quantity")),
                        });
                        toast.message(res.message);
                        return;
                      }
                      if (res.error) toast.error(res.error);
                      else {
                        toast.success("Produto registrado");
                        router.refresh();
                      }
                    });
                  }}
                >
                  <div>
                    <Label>Produto</Label>
                    <Select name="productId" required>
                      {data.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      name="quantity"
                      type="number"
                      step="0.1"
                      defaultValue={0.5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={pending}>
                    Registrar produto
                  </Button>
                </form>

                {companyConfirm ? (
                  <div className="mt-3 rounded-2xl border border-[var(--warning)]/40 bg-amber-500/10 p-3">
                    <p className="text-sm">Descontar do estoque da empresa?</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          startTransition(async () => {
                            const fd = new FormData();
                            fd.set("visitId", data.visit.id);
                            fd.set("productId", companyConfirm.productId);
                            fd.set("quantity", String(companyConfirm.quantity));
                            fd.set("source", "COMPANY");
                            const res = await addProductUsage(fd);
                            if (res.error) toast.error(res.error);
                            else {
                              toast.success("Descontado da empresa");
                              setCompanyConfirm(null);
                              router.refresh();
                            }
                          });
                        }}
                      >
                        Sim
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setCompanyConfirm(null)}
                      >
                        Não
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 space-y-2">
                  {data.usages.map((u) => (
                    <div
                      key={u.id}
                      className="flex justify-between rounded-2xl border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      <span>{u.product.name}</span>
                      <span>
                        {u.quantity} · {u.source === "CLIENT" ? "cliente" : "empresa"}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Leituras da água">
                <form
                  className="grid grid-cols-2 gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  action={(fd) => {
                    startTransition(async () => {
                      fd.set("visitId", data.visit.id);
                      await saveWaterReading(fd);
                      toast.success("Leitura salva");
                      router.refresh();
                    });
                  }}
                >
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
                  <div className="col-span-2">
                    <Button type="submit" className="w-full" disabled={pending}>
                      Salvar leitura
                    </Button>
                  </div>
                </form>
              </Section>

              <Section title="Observações">
                <form
                  className="space-y-3"
                  action={(fd) => {
                    startTransition(async () => {
                      fd.set("visitId", data.visit.id);
                      await addVisitNote(fd);
                      toast.success("Observação adicionada");
                      router.refresh();
                    });
                  }}
                >
                  <Textarea
                    name="content"
                    placeholder="Ex: piscina muito suja, animal solto…"
                    required
                  />
                  <Button type="submit" variant="secondary" className="w-full">
                    Adicionar
                  </Button>
                </form>
                <div className="mt-2 space-y-2">
                  {data.notes.map((n) => (
                    <p
                      key={n.id}
                      className="rounded-2xl bg-[var(--surface-2)] px-3 py-2 text-sm"
                    >
                      {n.content}
                    </p>
                  ))}
                </div>
              </Section>

              <Section title="Finalizar">
                <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  {!requiredOk ? (
                    <p className="text-sm text-[var(--danger)]">
                      Conclua os itens obrigatórios do checklist.
                    </p>
                  ) : null}
                  <div>
                    <Label>Foto final (obrigatória)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setFinalPhoto(await fileToDataUrl(file));
                      }}
                    />
                  </div>
                  {finalPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={finalPhoto}
                      alt="Final"
                      className="h-40 w-full rounded-2xl object-cover"
                    />
                  ) : null}
                  <div>
                    <Label>Assinatura do cliente</Label>
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                      <SignatureCanvas
                        ref={sigRef}
                        canvasProps={{
                          className: "h-36 w-full",
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => sigRef.current?.clear()}
                    >
                      Limpar assinatura
                    </Button>
                  </div>
                  <Textarea
                    id="final-obs"
                    name="observations"
                    placeholder="Observações finais"
                    defaultValue={data.visit.observations}
                  />
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={pending || !finalPhoto || !requiredOk}
                    onClick={() => {
                      startTransition(async () => {
                        const geo = await getGeo();
                        const fd = new FormData();
                        fd.set("visitId", data.visit.id);
                        fd.set("photoUrl", finalPhoto);
                        const obs = (
                          document.getElementById(
                            "final-obs",
                          ) as HTMLTextAreaElement | null
                        )?.value;
                        if (obs) fd.set("observations", obs);
                        const signature = sigRef.current?.isEmpty()
                          ? ""
                          : sigRef.current?.toDataURL("image/png") || "";
                        if (signature) fd.set("signatureDataUrl", signature);
                        if (geo.latitude)
                          fd.set("latitude", String(geo.latitude));
                        if (geo.longitude)
                          fd.set("longitude", String(geo.longitude));
                        const res = await finishVisit(fd);
                        if (res.error) toast.error(res.error);
                        else {
                          if (geo.latitude != null && geo.longitude != null) {
                            const { updateJourneyOrigin } = await import(
                              "@/components/dashboard/today-queue"
                            );
                            updateJourneyOrigin(geo.latitude, geo.longitude);
                          }
                          toast.success("Atendimento finalizado");
                          router.refresh();
                          router.push("/dashboard");
                        }
                      });
                    }}
                  >
                    Finalizar atendimento
                  </Button>
                </div>
              </Section>
            </>
          ) : null}
        </>
      ) : null}

      {data.visit.status === "COMPLETED" ? (
        <Section title="Resumo">
          <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
            <p>
              Duração:{" "}
              <strong>
                {minutesToLabel(data.visit.durationMinutes || duration)}
              </strong>
            </p>
            {data.visit.observations ? <p>{data.visit.observations}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              {data.photos
                .filter((p) => p.type === "ARRIVAL" || p.type === "FINAL")
                .map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.url}
                    alt={p.caption || p.type}
                    className="aspect-square rounded-2xl object-cover"
                  />
                ))}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  generateVisitPdf({
                    clientName: data.client.name,
                    employeeName: data.employee.name,
                    startedAt: data.visit.startedAt,
                    finishedAt: data.visit.finishedAt,
                    observations: data.visit.observations,
                    checklist: data.checklist.map((c) => ({
                      label: c.label,
                      checked: Boolean(c.response?.checked),
                    })),
                    usages: data.usages.map((u) => ({
                      name: u.product.name,
                      quantity: u.quantity,
                    })),
                    photos: data.photos,
                  })
                }
              >
                Baixar PDF
              </Button>
              {data.client.whatsapp ? (
                <Button asChild variant="soft">
                  <a
                    href={whatsappUrl(
                      data.client.whatsapp,
                      `Olá ${data.client.name}! Resumo da visita Aquatec:\n` +
                        `- Técnico: ${data.employee.name}\n` +
                        `- Duração: ${minutesToLabel(data.visit.durationMinutes || 0)}\n` +
                        (data.visit.observations
                          ? `- Obs: ${data.visit.observations}\n`
                          : "") +
                        `Obrigado pela preferência!`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar WhatsApp
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}
    </div>
  );
}
