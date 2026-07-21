import { cookies } from "next/headers";
import { getStore } from "@/lib/data/store";
import type { User } from "@/lib/data/types";

export const SESSION_COOKIE = "aquatec_session";

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const store = getStore();
  const user = store.users.find((u) => u.id === userId && u.active);
  return user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Não autenticado");
  }
  return user;
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
