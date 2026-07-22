"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="app-shell flex min-h-dvh flex-col justify-center px-5">
      <div className="animate-fade-up space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 w-full max-w-[280px] overflow-hidden rounded-[28px] bg-black shadow-lg shadow-black/20">
            <Image
              src="/brand/aquatec-logo.png"
              alt="Aquatec"
              width={640}
              height={640}
              className="h-auto w-full object-contain object-center"
              sizes="280px"
              priority
            />
          </div>
          <h1 className="sr-only">Aquatec</h1>
          <p className="text-sm text-[var(--muted)]">
            Entre para gerenciar sua operação
          </p>
        </div>

        <form
          className="space-y-4"
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await loginAction(formData);
              if (result?.error) setError(result.error);
            });
          }}
        >
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              defaultValue="master@aquatec.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              defaultValue="aquatec123"
              required
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="space-y-3 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-[var(--brand)] hover:underline"
          >
            Esqueci a senha
          </Link>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left text-xs text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">Demo</p>
            <p>master@aquatec.com / aquatec123</p>
            <p>funcionario@aquatec.com / aquatec123</p>
            <p>funcionario2@aquatec.com / aquatec123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
