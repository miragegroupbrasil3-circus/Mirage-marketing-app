import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { opcoesCookie } from "@/lib/supabase/opcoes";

export async function criarCliente() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    throw new Error("config");
  }

  const cookieStore = await cookies();

  return createServerClient(url, chave, {
    cookieOptions: opcoesCookie(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Em Server Component o proxy renova a sessão.
        }
      },
    },
  });
}
