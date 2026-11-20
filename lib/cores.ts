import type { StatusDemanda, StatusPeca, TipoDemanda, TipoPeca } from "@/lib/tipos";

export const COR_TIPO: Record<TipoPeca, string> = {
  reels: "#FF2D8A",
  stories: "#00E5D0",
  carrossel: "#7B2CFF",
  estatico: "#F5B700",
};

export const COR_STATUS: Record<StatusPeca, string> = {
  ideia: "#C8C2B6",
  em_producao: "#FF9F1C",
  pronto: "#00E5D0",
  publicado: "#F5B700",
};

export const SIGLA_TIPO: Record<TipoPeca, string> = {
  reels: "R",
  stories: "S",
  carrossel: "C",
  estatico: "P",
};

export const COR_DEMANDA: Record<TipoDemanda, string> = {
  flyer: "#F5B700",
  story: "#00E5D0",
  arte_feed: "#FF2D8A",
  video: "#7B2CFF",
  outro: "#C8C2B6",
};

export const COR_STATUS_DEMANDA: Record<StatusDemanda, string> = {
  a_fazer: "#C8C2B6",
  fazendo: "#FF9F1C",
  feito: "#00E5D0",
};
