"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/data/store";
import { SESSION_COOKIE, isSupabaseConfigured } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      if (data.user) {
        const store = getStore();
        const local = store.users.find(
          (u) => u.email.toLowerCase() === email,
        );
        if (local) {
          const cookieStore = await cookies();
          cookieStore.set(SESSION_COOKIE, local.id, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
          local.isOnline = true;
        }
        redirect("/dashboard");
      }
    } catch (e) {
      if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
      // fall through to demo
    }
  }

  const store = getStore();
  const user = store.users.find(
    (u) => u.email.toLowerCase() === email && u.password === password && u.active,
  );

  if (!user) {
    return { error: "E-mail ou senha inválidos." };
  }

  user.isOnline = true;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (userId) {
    const store = getStore();
    const user = store.users.find((u) => u.id === userId);
    if (user) user.isOnline = false;
  }

  // Precisa espelhar path/sameSite do login — delete() sozinho falha em vários ambientes
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/login`,
      });
    } catch {
      // ignore
    }
  }

  return {
    ok: true,
    message:
      "Se o e-mail existir, enviamos instruções de recuperação. Em modo demo, use a senha aquatec123.",
  };
}
