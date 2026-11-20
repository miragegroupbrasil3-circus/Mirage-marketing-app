import { rotuloDiaMes, rotuloSemana, segundaDaSemana, somarDias } from "@/lib/datas";
import { ROTULO_STATUS, ROTULO_TIPO } from "@/lib/rotulos";
import { STATUS_PECA, TIPOS_PECA, type ResumoPeca, type StatusPeca, type TipoPeca } from "@/lib/tipos";

export function horizonteDe(pecas: { data: string }[]) {
  if (pecas.length === 0) return null;
  return pecas.reduce((max, peca) => (peca.data > max ? peca.data : max), pecas[0].data);
}

export function noIntervalo<T extends { data: string }>(pecas: T[], inicio: string, fim: string) {
  return pecas.filter((peca) => peca.data >= inicio && peca.data <= fim);
}

export function contagem(pecas: { concluido: boolean }[]) {
  return {
    total: pecas.length,
    feitas: pecas.filter((peca) => peca.concluido).length,
  };
}

export function lacunas(pecas: { data: string }[], hoje: string, horizonte: string | null) {
  if (!horizonte || horizonte < hoje) return [];
  const ocupados = new Set(pecas.map((peca) => peca.data));
  const dias: string[] = [];
  for (let dia = hoje; dia < horizonte; dia = somarDias(dia, 1)) {
    if (!ocupados.has(dia)) dias.push(dia);
  }
  return dias;
}

export function sequenciaDias(pecas: { data: string; concluido: boolean }[], hoje: string) {
  const porDia = new Map<string, { total: number; feitas: number }>();
  for (const peca of pecas) {
    if (peca.data > hoje) continue;
    const atual = porDia.get(peca.data) ?? { total: 0, feitas: 0 };
    atual.total += 1;
    if (peca.concluido) atual.feitas += 1;
    porDia.set(peca.data, atual);
  }

  let cursor = hoje;
  const hojeInfo = porDia.get(hoje);
  if (!hojeInfo || hojeInfo.feitas < hojeInfo.total) cursor = somarDias(hoje, -1);

  let dias = 0;
  for (let passo = 0; passo < 366; passo += 1) {
    const info = porDia.get(cursor);
    if (!info || info.feitas < info.total) break;
    dias += 1;
    cursor = somarDias(cursor, -1);
  }
  return dias;
}

export function porSemana(pecas: ResumoPeca[]) {
  const mapa = new Map<string, { inicio: string; planejadas: number; concluidas: number }>();
  for (const peca of pecas) {
    const inicio = segundaDaSemana(peca.data);
    const atual = mapa.get(inicio) ?? { inicio, planejadas: 0, concluidas: 0 };
    atual.planejadas += 1;
    if (peca.concluido) atual.concluidas += 1;
    mapa.set(inicio, atual);
  }
  return [...mapa.values()]
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .map((item) => ({
      inicio: item.inicio,
      nome: rotuloDiaMes(item.inicio),
      periodo: rotuloSemana(item.inicio),
      planejadas: item.planejadas,
      concluidas: item.concluidas,
    }));
}

export function porFormato(pecas: ResumoPeca[]) {
  return TIPOS_PECA.map((tipo) => {
    const lista = pecas.filter((peca) => peca.tipo === tipo);
    return {
      tipo,
      nome: ROTULO_TIPO[tipo],
      planejadas: lista.length,
      concluidas: lista.filter((peca) => peca.concluido).length,
    };
  }).filter((item) => item.planejadas > 0);
}

export function porStatus(pecas: ResumoPeca[]) {
  return STATUS_PECA.map((status) => ({
    status,
    nome: ROTULO_STATUS[status],
    total: pecas.filter((peca) => peca.status === status).length,
  })).filter((item) => item.total > 0);
}

export function porPessoa(pecas: ResumoPeca[], nomes: Map<string, string>) {
  const mapa = new Map<string, number>();
  for (const peca of pecas) {
    if (!peca.concluido || !peca.concluido_por) continue;
    mapa.set(peca.concluido_por, (mapa.get(peca.concluido_por) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([id, total]) => ({ id, nome: nomes.get(id) || "Equipe", total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"));
}

export function fraseHorizonte(horizonte: string | null, hoje: string) {
  if (!horizonte) return "Nenhum conteúdo planejado ainda.";
  const data = rotuloDiaMes(horizonte);
  if (horizonte < hoje) return `O último conteúdo planejado foi em ${data}.`;
  if (horizonte === hoje) return `Conteúdo planejado até hoje, ${data}.`;
  return `Conteúdo planejado até ${data}`;
}

export const COR_GRAFICO: Record<TipoPeca | StatusPeca | "planejadas" | "concluidas", string> = {
  reels: "#FF2D8A",
  stories: "#00E5D0",
  carrossel: "#7B2CFF",
  estatico: "#F5B700",
  ideia: "#C8C2B6",
  em_producao: "#FF9F1C",
  pronto: "#00E5D0",
  publicado: "#F5B700",
  planejadas: "#7B2CFF",
  concluidas: "#F5B700",
};
