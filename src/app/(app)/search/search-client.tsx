"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { findClientByQr, globalSearch } from "@/lib/data/actions";
import { TopBar } from "@/components/layout/top-bar";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, Section } from "@/components/ui/misc";

export default function SearchPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<
    ReturnType<typeof globalSearch>
  > | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        setResults(await globalSearch(query));
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <TopBar title="Busca" />
      <div className="space-y-4 animate-fade-up">
        <Input
          placeholder="Clientes, produtos, funcionários…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={mode !== "qr"}
        />

        <Section title="QR Code do cliente">
          <div className="space-y-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <Label>Token / código</Label>
            <Input
              placeholder="qr_ana_oliveira"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={pending || !qrToken}
              onClick={() => {
                startTransition(async () => {
                  const token = qrToken
                    .replace("aquatec://client/", "")
                    .trim();
                  const client = await findClientByQr(token);
                  if (!client) return;
                  router.push(`/clients/${client.id}`);
                });
              }}
            >
              Abrir cliente
            </Button>
            <p className="text-xs text-[var(--muted)]">
              Demo: qr_ana_oliveira · qr_roberto_mendes · qr_fernanda_costa
            </p>
          </div>
        </Section>

        {results ? (
          <>
            <Section title="Clientes">
              {results.clients.length === 0 ? (
                <EmptyState title="Nenhum cliente" />
              ) : (
                <div className="space-y-2">
                  {results.clients.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clients/${c.id}`}
                      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Produtos">
              {results.products.length === 0 ? (
                <EmptyState title="Nenhum produto" />
              ) : (
                <div className="space-y-2">
                  {results.products.map((p) => (
                    <Link
                      key={p.id}
                      href="/stock"
                      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Funcionários">
              {results.employees.length === 0 ? (
                <EmptyState title="Nenhum funcionário" />
              ) : (
                <div className="space-y-2">
                  {results.employees.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                    >
                      {e.name}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        ) : null}
      </div>
    </>
  );
}
