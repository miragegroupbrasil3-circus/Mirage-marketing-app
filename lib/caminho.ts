import { semanaIso } from "@/lib/datas";

export function slugificar(texto: string) {
  const slug = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "item";
}

export function slugPeca(tipo: string) {
  const sufixo = Math.random().toString(36).slice(2, 6);
  return slugificar(`${tipo}-${sufixo}`);
}

export function nomeSeguro(nome: string) {
  const base = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const limpo = base.replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  return limpo.slice(0, 80) || "arquivo";
}

export function caminhoMidia(entrada: {
  pracaSlug: string;
  data: string;
  pecaSlug: string;
  versao: number;
  arquivo: string;
}) {
  const semana = semanaIso(entrada.data);
  const arquivo = `v${entrada.versao}-${nomeSeguro(entrada.arquivo)}`;
  return [entrada.pracaSlug, semana, entrada.data, entrada.pecaSlug, arquivo].join("/");
}
