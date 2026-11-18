import type { Pilar, StatusPeca, TipoPeca } from "@/lib/tipos";

export const ROTULO_TIPO: Record<TipoPeca, string> = {
  reels: "Reels",
  carrossel: "Carrossel",
  estatico: "Estático",
  stories: "Stories",
};

export const ROTULO_PILAR: Record<Pilar, string> = {
  espetaculo: "Espetáculo",
  estrutura: "Estrutura",
  vida_no_circo: "Vida no circo",
  publico: "Público",
};

export const ROTULO_STATUS: Record<StatusPeca, string> = {
  ideia: "Ideia",
  em_producao: "Em produção",
  pronto: "Pronto",
  publicado: "Publicado",
};

export const ROTULO_CAMPO: Record<string, string> = {
  titulo: "Título",
  legenda: "Legenda",
  cta: "Chamada",
  data: "Data",
  horario: "Horário",
  tipo: "Formato",
  pilar: "Pilar",
  status: "Estado",
  ordem: "Ordem",
  slug: "Caminho",
  praca_id: "Praça",
};

export function textoHistorico(campo: string, valor: unknown) {
  if (valor == null) return "vazio";
  const cru = typeof valor === "string" ? valor : String(valor);
  if (campo === "tipo" && cru in ROTULO_TIPO) return ROTULO_TIPO[cru as TipoPeca];
  if (campo === "pilar" && cru in ROTULO_PILAR) return ROTULO_PILAR[cru as Pilar];
  if (campo === "status" && cru in ROTULO_STATUS) return ROTULO_STATUS[cru as StatusPeca];
  if (campo === "horario") return cru.slice(0, 5);
  if (!cru) return "vazio";
  return cru;
}
