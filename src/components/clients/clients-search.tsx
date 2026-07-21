"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function ClientsSearch({ initial }: { initial?: string }) {
  const router = useRouter();

  return (
    <Input
      placeholder="Buscar cliente…"
      defaultValue={initial}
      onChange={(e) => {
        const value = e.target.value;
        const url = value ? `/clients?q=${encodeURIComponent(value)}` : "/clients";
        router.replace(url);
      }}
    />
  );
}
