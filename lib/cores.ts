import type { StatusPeca, TipoPeca } from "@/lib/tipos";

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
