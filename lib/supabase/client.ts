"use client";

import { createBrowserClient } from "@supabase/ssr";
import { opcoesCookie } from "@/lib/supabase/opcoes";

let cliente: ReturnType<typeof createBrowserClient> | undefined;

export function criarClienteNavegador() {
  if (!cliente) {
    cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookieOptions: opcoesCookie() },
    );
  }
  return cliente;
}
