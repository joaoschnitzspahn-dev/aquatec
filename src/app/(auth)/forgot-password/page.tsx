"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="app-shell flex min-h-dvh flex-col justify-center px-5">
      <div className="animate-fade-up space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Aquatec
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Recuperar senha
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Enviaremos um link de redefinição para o seu e-mail.
          </p>
        </div>

        <form
          className="space-y-4"
          action={(formData) => {
            startTransition(async () => {
              const result = await forgotPasswordAction(formData);
              setMessage(result.message);
            });
          }}
        >
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando…" : "Enviar link"}
          </Button>
        </form>

        {message ? (
          <p className="rounded-2xl bg-[var(--brand-soft)] p-3 text-sm text-[var(--brand)]">
            {message}
          </p>
        ) : null}

        <Link href="/login" className="block text-center text-sm text-[var(--muted)]">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
