import { diasInclusivos, somarDias } from "@/lib/datas";
import type { MarcoConteudo } from "@/lib/tipos";

export const COOKIE_TEMPORADA_PREVIA = "mirage-preview-temporada";

export function gravarTemporadaPrevia(inicio: string, fim: string) {
  const valor = `${inicio || "-"}|${fim || "-"}`;
  document.cookie = `${COOKIE_TEMPORADA_PREVIA}=${valor}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function fimAjustado(fim: string, inicio: string, delta: number, hoje: string) {
  const base = fim || inicio || hoje;
  return somarDias(base, delta);
}

export function foraDoPeriodo(data: string, inicio: string, fim: string) {
  if (inicio && data < inicio) return true;
  if (fim && data > fim) return true;
  return false;
}

export function resumoTemporada(inicio: string, fim: string, pecas: MarcoConteudo[], demandas: MarcoConteudo[]) {
  const valido = Boolean(inicio && fim && fim >= inicio);
  const dias = valido ? diasInclusivos(inicio, fim) : null;
  const pecasFora = inicio || fim ? pecas.filter((item) => foraDoPeriodo(item.data, inicio, fim)) : [];
  const demandasFora = inicio || fim ? demandas.filter((item) => foraDoPeriodo(item.data, inicio, fim)) : [];
  return { dias, valido, pecasFora, demandasFora };
}
