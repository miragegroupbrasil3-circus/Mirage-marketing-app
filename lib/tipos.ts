export const TIPOS_PECA = ["reels", "carrossel", "estatico", "stories"] as const;
export const PILARES = ["espetaculo", "estrutura", "vida_no_circo", "publico"] as const;
export const STATUS_PECA = ["ideia", "em_producao", "pronto", "publicado"] as const;
export const TIPOS_MIDIA = ["imagem", "video"] as const;

export type TipoPeca = (typeof TIPOS_PECA)[number];
export type Pilar = (typeof PILARES)[number];
export type StatusPeca = (typeof STATUS_PECA)[number];
export type TipoMidia = (typeof TIPOS_MIDIA)[number];

export type Praca = {
  id: string;
  cidade: string;
  slug: string;
  temporada: string | null;
  inicio: string | null;
  fim: string | null;
  ativa: boolean;
  e_exemplo: boolean;
};

export type Peca = {
  id: string;
  praca_id: string;
  semana_id: string | null;
  data: string;
  horario: string | null;
  tipo: TipoPeca;
  titulo: string;
  legenda: string;
  cta: string | null;
  pilar: Pilar;
  status: StatusPeca;
  ordem: number;
  slug: string;
  criado_por: string | null;
  atualizado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Midia = {
  id: string;
  peca_id: string;
  storage_path: string;
  tipo: TipoMidia;
  versao: number;
  e_final: boolean;
  largura: number | null;
  altura: number | null;
  duracao_segundos: number | null;
  nome_arquivo: string;
  mime: string | null;
  bytes: number | null;
  criado_em: string;
  url: string | null;
};

export type Comentario = {
  id: string;
  peca_id: string;
  autor_id: string | null;
  texto: string;
  criado_em: string;
  autor_nome: string;
};

export type ItemHistorico = {
  id: string;
  peca_id: string;
  autor_id: string | null;
  campo: string;
  antes: unknown;
  depois: unknown;
  criado_em: string;
  autor_nome: string;
};

export type Sessao = {
  id: string;
  nome: string;
  semPerfil?: boolean;
};

export const LIMITE_ARQUIVO = 50 * 1024 * 1024;

export function mensagemArquivoGrande(nome: string) {
  return `“${nome}” passa de 50 MB. O plano gratuito do Supabase aceita até 50 MB por arquivo.`;
}
