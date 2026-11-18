"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mensagemAuth } from "@/lib/auth-mensagem";
import { COOKIE_PRACA } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";
import { criarCliente } from "@/lib/supabase/server";

function destinoSeguro(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "");
  if (!texto.startsWith("/") || texto.startsWith("//") || texto.includes("\\")) return "/hoje";
  return texto;
}

export async function entrar(formData: FormData) {
  if (previewAtivo()) {
    redirect("/hoje");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    return { erro: "O acesso ainda não está configurado neste servidor." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await criarCliente();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: mensagemAuth(error.message) };

  revalidatePath("/", "layout");
  redirect(destinoSeguro(formData.get("next")));
}

export async function sair() {
  if (!previewAtivo()) {
    const supabase = await criarCliente();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(COOKIE_PRACA);
  revalidatePath("/", "layout");
  redirect(previewAtivo() ? "/login?ver=1" : "/login");
}

export async function escolherPraca(id: string) {
  const store = await cookies();
  store.set(COOKIE_PRACA, id, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 400 * 24 * 60 * 60,
  });
  revalidatePath("/", "layout");
}
