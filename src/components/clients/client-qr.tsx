"use client";

import { QRCodeSVG } from "qrcode.react";

export function ClientQr({ token, name }: { token: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="rounded-2xl bg-white p-3">
        <QRCodeSVG value={`aquatec://client/${token}`} size={160} />
      </div>
      <p className="text-center text-sm text-[var(--muted)]">
        QR de {name} — escaneie na chegada
      </p>
    </div>
  );
}
