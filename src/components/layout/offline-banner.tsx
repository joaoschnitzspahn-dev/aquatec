"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { syncQueue } from "@/lib/offline/db";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const onOnline = async () => {
      setSyncing(true);
      try {
        await syncQueue();
      } finally {
        setSyncing(false);
      }
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline && !syncing) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 rounded-full bg-[var(--warning)] px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
        <WifiOff className="h-3.5 w-3.5" />
        {offline ? "Sem conexão — salvando localmente" : "Sincronizando…"}
      </div>
    </div>
  );
}
