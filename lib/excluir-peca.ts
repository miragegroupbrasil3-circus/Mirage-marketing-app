"use client";

import { criarClienteNavegador } from "@/lib/supabase/client";

export async function excluirPecaNoBanco(id: string) {
  const supabase = criarClienteNavegador();
  const { data: midias } = await supabase.from("midias").select("storage_path").eq("peca_id", id);
  const caminhos = ((midias ?? []) as { storage_path?: string }[])
    .map((midia) => midia.storage_path)
    .filter((caminho): caminho is string => Boolean(caminho));
  if (caminhos.length > 0) {
    await supabase.storage.from("midias").remove(caminhos);
  }
  const { error } = await supabase.from("pecas").delete().eq("id", id);
  return error ? "Não foi possível excluir a peça." : null;
}
