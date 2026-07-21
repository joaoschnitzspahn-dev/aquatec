import { Suspense } from "react";
import SearchPageClient from "./search-client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-[var(--muted)]">Carregando…</div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
