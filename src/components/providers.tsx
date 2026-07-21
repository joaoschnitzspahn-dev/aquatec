"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { OfflineBanner } from "@/components/layout/offline-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <OfflineBanner />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
