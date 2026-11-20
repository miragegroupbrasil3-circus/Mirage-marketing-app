import { cache } from "react";
import { cookies } from "next/headers";
import { criarCliente } from "@/lib/supabase/server";
import { previewAtivo } from "@/lib/preview";
import {
  comentariosExemplo,
  historicoExemplo,
  ID_PRACA_EXEMPLO,
  membrosExemplo,
  midiasExemplo,
  pecasExemplo,
  pracaExemplo,
  sessaoExemplo,
} from "@/lib/exemplo";
import { normalizarStatus, type Comentario, type ItemHistorico, type Membro, type Midia, type Peca, type PecaLista, type Praca, type ResumoPeca, type Sessao } from "@/lib/tipos";

export const COOKIE_PRACA = "mirage-praca";

async function assinar(caminhos: string[]) {
  const unicos = [...new Set(caminhos.filter(Boolean))];
  if (unicos.length === 0) return new Map<string, string>();
  const supabase = await criarCliente();
  const { data } = await supabase.storage.from("midias").createSignedUrls(unicos, 60 * 60);
  const mapa = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}

function mapearMidia(linha: Record<string, unknown>, url: string | null): Midia {
  return {
    id: String(linha.id),
    peca_id: String(linha.peca_id),
    storage_path: String(linha.storage_path),
    tipo: linha.tipo === "video" ? "video" : "imagem",
    versao: Number(linha.versao ?? 1),
    e_final: Boolean(linha.e_final),
    largura: linha.largura == null ? null : Number(linha.largura),
    altura: linha.altura == null ? null : Number(linha.altura),
    duracao_segundos: linha.duracao_segundos == null ? null : Number(linha.duracao_segundos),
    nome_arquivo: String(linha.nome_arquivo ?? "arquivo"),
    mime: linha.mime == null ? null : String(linha.mime),
    bytes: linha.bytes == null ? null : Number(linha.bytes),
    criado_em: String(linha.criado_em),
    url,
  };
}

function mapearPeca(linha: Record<string, unknown>): Peca {
  return {
    id: String(linha.id),
    praca_id: String(linha.praca_id),
    semana_id: linha.semana_id == null ? null : String(linha.semana_id),
    data: String(linha.data),
    horario: linha.horario == null ? null : String(linha.horario),
    tipo: linha.tipo as Peca["tipo"],
    titulo: String(linha.titulo ?? ""),
    legenda: String(linha.legenda ?? ""),
    cta: linha.cta == null ? null : String(linha.cta),
    pilar: linha.pilar as Peca["pilar"],
    status: linha.status as Peca["status"],
    concluido: Boolean(linha.concluido),
    concluido_por: linha.concluido_por == null ? null : String(linha.concluido_por),
    concluido_em: linha.concluido_em == null ? null : String(linha.concluido_em),
    ordem: Number(linha.ordem ?? 0),
    slug: String(linha.slug),
    criado_por: linha.criado_por == null ? null : String(linha.criado_por),
    atualizado_por: linha.atualizado_por == null ? null : String(linha.atualizado_por),
    criado_em: String(linha.criado_em),
    atualizado_em: String(linha.atualizado_em),
  };
}

export const obterSessao = cache(async (): Promise<Sessao | null> => {
  if (previewAtivo()) return sessaoExemplo;
  const supabase = await criarCliente();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("nome, status")
    .eq("id", data.user.id)
    .maybeSingle();
  if (error || !perfil) {
    return { id: data.user.id, nome: "Equipe", status: "pendente", semPerfil: true };
  }
  return { id: data.user.id, nome: perfil.nome, status: normalizarStatus(perfil.status) };
});

export const listarMembros = cache(async (): Promise<Membro[]> => {
  if (previewAtivo()) return membrosExemplo.map((membro) => ({ ...membro }));
  const supabase = await criarCliente();
  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, email, status, criado_em")
    .order("criado_em", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((linha) => ({
    id: String(linha.id),
    nome: String(linha.nome ?? "Equipe"),
    email: linha.email == null || linha.email === "" ? null : String(linha.email),
    status: normalizarStatus(linha.status),
    criado_em: String(linha.criado_em),
  }));
});

export const contarPendentes = cache(async (): Promise<number> => {
  if (previewAtivo()) return membrosExemplo.filter((membro) => membro.status === "pendente").length;
  const supabase = await criarCliente();
  const { count, error } = await supabase
    .from("perfis")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  if (error) throw new Error(error.message);
  return count ?? 0;
});

export const listarPracas = cache(async (): Promise<Praca[]> => {
  if (previewAtivo()) return [pracaExemplo];
  const supabase = await criarCliente();
  const { data, error } = await supabase.from("pracas").select("*").order("cidade");
  if (error) throw new Error(error.message);
  return (data ?? []) as Praca[];
});

export async function pracaAtiva(pracas: Praca[]) {
  const store = await cookies();
  const escolhida = store.get(COOKIE_PRACA)?.value;
  return pracas.find((praca) => praca.id === escolhida) ?? pracas.find((praca) => praca.ativa) ?? pracas[0] ?? null;
}

function contarNotas(bruto: unknown) {
  if (!Array.isArray(bruto) || bruto.length === 0) return 0;
  const primeiro = bruto[0];
  if (primeiro && typeof primeiro === "object" && "count" in primeiro) {
    return Number((primeiro as { count: number }).count) || 0;
  }
  return bruto.length;
}

function enriquecerExemplo(peca: Peca): PecaLista {
  return {
    ...peca,
    midiaFinal: midiasExemplo(peca.id).find((midia) => midia.e_final) ?? null,
    notas: comentariosExemplo(peca.id).length,
  };
}

export async function pecasNoIntervalo(pracaId: string, inicio: string, fim: string, ancoraHoje = false): Promise<PecaLista[]> {
  if (previewAtivo()) {
    const origem = ancoraHoje ? pecasExemplo() : pecasExemplo(inicio);
    return origem
      .filter((peca) => peca.praca_id === pracaId && peca.data >= inicio && peca.data <= fim)
      .map(enriquecerExemplo);
  }

  const supabase = await criarCliente();
  const { data, error } = await supabase
    .from("pecas")
    .select("*, midias(id, peca_id, storage_path, tipo, versao, e_final, largura, altura, duracao_segundos, nome_arquivo, mime, bytes, criado_em), comentarios(count)")
    .eq("praca_id", pracaId)
    .gte("data", inicio)
    .lte("data", fim)
    .order("ordem", { ascending: true });

  if (error) throw new Error(error.message);

  const linhas = (data ?? []) as Array<Record<string, unknown> & { midias?: Record<string, unknown>[]; comentarios?: unknown }>;
  const finais = linhas.flatMap((linha) => (linha.midias ?? []).filter((midia) => midia.e_final));
  const urls = await assinar(finais.map((midia) => String(midia.storage_path)));

  return linhas.map((linha) => {
    const final = (linha.midias ?? []).find((midia) => midia.e_final);
    return {
      ...mapearPeca(linha),
      midiaFinal: final ? mapearMidia(final, urls.get(String(final.storage_path)) ?? null) : null,
      notas: contarNotas(linha.comentarios),
    };
  });
}

function mapearResumo(linha: Record<string, unknown>): ResumoPeca {
  return {
    id: String(linha.id),
    data: String(linha.data),
    tipo: linha.tipo as ResumoPeca["tipo"],
    status: linha.status as ResumoPeca["status"],
    concluido: Boolean(linha.concluido),
    concluido_por: linha.concluido_por == null ? null : String(linha.concluido_por),
    titulo: String(linha.titulo ?? ""),
  };
}

export async function listarResumo(pracaId: string): Promise<ResumoPeca[]> {
  if (previewAtivo()) {
    return pecasExemplo()
      .filter((peca) => peca.praca_id === pracaId)
      .map((peca) => ({
        id: peca.id,
        data: peca.data,
        tipo: peca.tipo,
        status: peca.status,
        concluido: peca.concluido,
        concluido_por: peca.concluido_por,
        titulo: peca.titulo,
      }));
  }

  const supabase = await criarCliente();
  const { data, error } = await supabase
    .from("pecas")
    .select("id, data, tipo, status, concluido, concluido_por, titulo")
    .eq("praca_id", pracaId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapearResumo);
}

export async function obterPeca(id: string) {
  if (previewAtivo()) {
    const encontrada = pecasExemplo().find((peca) => peca.id === id) ?? null;
    if (!encontrada && id !== "nova") return null;
    return encontrada;
  }
  const supabase = await criarCliente();
  const { data, error } = await supabase.from("pecas").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapearPeca(data as Record<string, unknown>) : null;
}

export async function listarMidias(pecaId: string) {
  if (previewAtivo()) return midiasExemplo(pecaId);
  const supabase = await criarCliente();
  const { data, error } = await supabase
    .from("midias")
    .select("*")
    .eq("peca_id", pecaId)
    .order("versao", { ascending: true });
  if (error) throw new Error(error.message);
  const linhas = (data ?? []) as Record<string, unknown>[];
  const urls = await assinar(linhas.map((linha) => String(linha.storage_path)));
  return linhas.map((linha) => mapearMidia(linha, urls.get(String(linha.storage_path)) ?? null));
}

export async function listarComentarios(pecaId: string): Promise<Comentario[]> {
  if (previewAtivo()) return comentariosExemplo(pecaId);
  const supabase = await criarCliente();
  const { data, error } = await supabase
    .from("comentarios")
    .select("id, peca_id, autor_id, texto, criado_em, perfis(nome)")
    .eq("peca_id", pecaId)
    .order("criado_em", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((linha) => {
    const perfil = linha.perfis as { nome?: string } | { nome?: string }[] | null;
    const nome = Array.isArray(perfil) ? perfil[0]?.nome : perfil?.nome;
    return {
      id: String(linha.id),
      peca_id: String(linha.peca_id),
      autor_id: linha.autor_id == null ? null : String(linha.autor_id),
      texto: String(linha.texto),
      criado_em: String(linha.criado_em),
      autor_nome: nome || "Equipe",
    };
  });
}

export async function listarHistorico(pecaId: string): Promise<ItemHistorico[]> {
  if (previewAtivo()) return historicoExemplo(pecaId);
  const supabase = await criarCliente();
  const { data, error } = await supabase
    .from("historico")
    .select("id, peca_id, autor_id, campo, antes, depois, criado_em, perfis(nome)")
    .eq("peca_id", pecaId)
    .order("criado_em", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((linha) => {
    const perfil = linha.perfis as { nome?: string } | { nome?: string }[] | null;
    const nome = Array.isArray(perfil) ? perfil[0]?.nome : perfil?.nome;
    return {
      id: String(linha.id),
      peca_id: String(linha.peca_id),
      autor_id: linha.autor_id == null ? null : String(linha.autor_id),
      campo: String(linha.campo),
      antes: linha.antes,
      depois: linha.depois,
      criado_em: String(linha.criado_em),
      autor_nome: nome || "Equipe",
    };
  });
}

export { ID_PRACA_EXEMPLO };
