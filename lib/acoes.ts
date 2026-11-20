"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mensagemAuth } from "@/lib/auth-mensagem";
import { COOKIE_PRACA } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";
import { criarCliente } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RespostaAcesso = { erro?: string; aviso?: string };

function destinoSeguro(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "");
  if (!texto.startsWith("/") || texto.startsWith("//") || texto.includes("\\")) return "/calendario";
  return texto;
}

async function destinoDepoisDoAcesso(
  supabase: Awaited<ReturnType<typeof criarCliente>>,
  id: string,
  next: FormDataEntryValue | null,
) {
  if (!id) return "/aguardando";
  const { data } = await supabase.from("perfis").select("status").eq("id", id).maybeSingle();
  if (data?.status === "aprovado") return destinoSeguro(next);
  if (data?.status === "recusado") return "/recusado";
  return "/aguardando";
}

export async function entrar(formData: FormData): Promise<RespostaAcesso> {
  if (previewAtivo()) {
    redirect("/calendario");
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: mensagemAuth(error.message) };

  revalidatePath("/", "layout");
  redirect(await destinoDepoisDoAcesso(supabase, data.user?.id ?? "", formData.get("next")));
}

export async function cadastrar(formData: FormData): Promise<RespostaAcesso> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!nome || nome.length > 120) {
    return { erro: "O nome precisa ter entre 1 e 120 caracteres." };
  }
  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }
  if (senha.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }

  if (previewAtivo()) {
    return { aviso: "A prévia não cria conta. Desligue MIRAGE_PREVIEW para cadastrar." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    return { erro: "O acesso ainda não está configurado neste servidor." };
  }

  const supabase = await criarCliente();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });
  if (error) return { erro: mensagemAuth(error.message, "criar") };
  if (!data.session || !data.user) {
    return { aviso: "Conta criada. Confirme o e-mail e depois entre com a senha." };
  }

  revalidatePath("/", "layout");
  redirect(await destinoDepoisDoAcesso(supabase, data.user.id, formData.get("next")));
}

export async function definirStatusMembro(id: string, status: "aprovado" | "recusado") {
  if (previewAtivo()) {
    return { erro: "A prévia não grava aprovação." };
  }
  if (!UUID.test(id) || (status !== "aprovado" && status !== "recusado")) {
    return { erro: "Não foi possível atualizar este acesso." };
  }

  const supabase = await criarCliente();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { erro: "Entre de novo para continuar." };
  if (data.user.id === id) return { erro: "Você não pode alterar o próprio status." };

  const { error } = await supabase.rpc("aprovar_membro", { id, novo_status: status });
  if (error) return { erro: "Não foi possível atualizar este acesso." };

  revalidatePath("/", "layout");
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
