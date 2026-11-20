import { diasDaSemana, hojeISO, segundaDaSemana, somarDias } from "@/lib/datas";
import type { Comentario, Demanda, ItemHistorico, Membro, Midia, Peca, Praca, Sessao } from "@/lib/tipos";

export const ID_PRACA_EXEMPLO = "11111111-1111-4111-8111-111111111111";
export const ID_USUARIO_EXEMPLO = "00000000-0000-4000-8000-000000000001";

export const sessaoExemplo: Sessao = {
  id: ID_USUARIO_EXEMPLO,
  nome: "Prévia",
  status: "aprovado",
};

export const membrosExemplo: Membro[] = [
  {
    id: ID_USUARIO_EXEMPLO,
    nome: "Prévia",
    email: "previa@exemplo.mirage",
    status: "aprovado",
    criado_em: "2026-11-01T15:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    nome: "Lia",
    email: "lia@exemplo.mirage",
    status: "aprovado",
    criado_em: "2026-11-03T18:30:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    nome: "Nuno",
    email: "nuno@exemplo.mirage",
    status: "pendente",
    criado_em: "2026-11-18T11:05:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    nome: "Caio",
    email: "caio@exemplo.mirage",
    status: "recusado",
    criado_em: "2026-11-12T09:20:00.000Z",
  },
];

export const pracaExemplo: Praca = {
  id: ID_PRACA_EXEMPLO,
  cidade: "Exemplo",
  slug: "exemplo",
  temporada: "Temporada de exemplo",
  inicio: null,
  fim: null,
  ativa: false,
  e_exemplo: true,
};

export function pracaPrevia(ajuste?: { inicio: string | null; fim: string | null }): Praca {
  const hoje = hojeISO();
  return {
    ...pracaExemplo,
    inicio: ajuste ? ajuste.inicio : segundaDaSemana(hoje),
    fim: ajuste ? ajuste.fim : hoje,
  };
}

function peca(
  parcial: Omit<
    Peca,
    | "praca_id"
    | "semana_id"
    | "legenda"
    | "cta"
    | "criado_por"
    | "atualizado_por"
    | "criado_em"
    | "atualizado_em"
    | "concluido"
    | "concluido_por"
    | "concluido_em"
  > & {
    legenda?: string;
    cta?: string | null;
    concluido?: boolean;
    concluido_por?: string | null;
    concluido_em?: string | null;
  },
): Peca {
  return {
    praca_id: ID_PRACA_EXEMPLO,
    semana_id: null,
    legenda: parcial.legenda ?? "",
    cta: parcial.cta ?? null,
    concluido: false,
    concluido_por: null,
    concluido_em: null,
    criado_por: ID_USUARIO_EXEMPLO,
    atualizado_por: ID_USUARIO_EXEMPLO,
    criado_em: "2026-11-18T12:00:00.000Z",
    atualizado_em: "2026-11-18T12:00:00.000Z",
    ...parcial,
  };
}

export function pecasExemplo(segunda = segundaDaSemana(hojeISO())): Peca[] {
  const dias = diasDaSemana(segunda);
  const hoje = hojeISO();
  const indiceHoje = Math.max(0, dias.indexOf(hoje));
  const outro = dias[(indiceHoje + 2) % 7];
  const mais = dias[(indiceHoje + 4) % 7];

  return [
    peca({
      id: "22222222-2222-4222-8222-222222222221",
      data: dias[indiceHoje],
      horario: "18:00:00",
      tipo: "reels",
      titulo: "Olha onde a moto vai passar.",
      legenda: "Abrir com a geografia da manobra e entregar o trajeto.",
      cta: null,
      pilar: "espetaculo",
      status: "pronto",
      ordem: 0,
      slug: "reels-01",
    }),
    peca({
      id: "22222222-2222-4222-8222-222222222222",
      data: dias[indiceHoje],
      horario: "19:30:00",
      tipo: "stories",
      titulo: "Picadeiro ou quem veio com você?",
      legenda: "Trecho do número e uma pergunta. Sem depoimento inventado.",
      pilar: "publico",
      status: "em_producao",
      ordem: 1,
      slug: "stories-01",
    }),
    peca({
      id: "22222222-2222-4222-8222-222222222223",
      data: outro,
      horario: "11:00:00",
      tipo: "carrossel",
      titulo: "Você entra por aqui.",
      legenda: "Percurso da entrada ao picadeiro, quando houver imagem real.",
      pilar: "estrutura",
      status: "ideia",
      ordem: 0,
      slug: "carrossel-01",
    }),
    peca({
      id: "22222222-2222-4222-8222-222222222224",
      data: mais,
      horario: "21:00:00",
      tipo: "reels",
      titulo: "Quando o público sai, a rotina continua.",
      pilar: "vida_no_circo",
      status: "publicado",
      concluido: true,
      concluido_por: ID_USUARIO_EXEMPLO,
      concluido_em: "2026-11-18T18:00:00.000Z",
      ordem: 0,
      slug: "reels-02",
    }),
    peca({
      id: "22222222-2222-4222-8222-222222222225",
      data: somarDias(dias[indiceHoje], indiceHoje === 6 ? -1 : 1),
      horario: null,
      tipo: "estatico",
      titulo: "Na tela, a altura engana.",
      pilar: "espetaculo",
      status: "ideia",
      ordem: 0,
      slug: "estatico-01",
    }),
  ];
}

export function midiasExemplo(pecaId: string): Midia[] {
  if (pecaId !== "22222222-2222-4222-8222-222222222221") return [];
  return [
    {
      id: "33333333-3333-4333-8333-333333333331",
      peca_id: pecaId,
      storage_path: "exemplo/semana/dia/reels-01/v1-referencia.svg",
      tipo: "imagem",
      versao: 1,
      e_final: true,
      largura: null,
      altura: null,
      duracao_segundos: null,
      nome_arquivo: "referencia.svg",
      mime: "image/svg+xml",
      bytes: null,
      criado_em: "2026-11-18T12:00:00.000Z",
      url: null,
    },
  ];
}

export function comentariosExemplo(pecaId: string): Comentario[] {
  if (pecaId !== "22222222-2222-4222-8222-222222222221") return [];
  return [
    {
      id: "44444444-4444-4444-8444-444444444441",
      peca_id: pecaId,
      autor_id: ID_USUARIO_EXEMPLO,
      texto: "Conferir se a captação mostra a escala, sem inventar altura.",
      criado_em: "2026-11-18T15:00:00.000Z",
      autor_nome: "Prévia",
    },
  ];
}

export function demandasExemplo(): Demanda[] {
  const hoje = hojeISO();
  const segunda = segundaDaSemana(hoje);
  const base = {
    praca_id: ID_PRACA_EXEMPLO,
    criado_por: ID_USUARIO_EXEMPLO,
    criado_em: "2026-11-18T12:00:00.000Z",
    atualizado_em: "2026-11-18T12:00:00.000Z",
  };
  return [
    {
      ...base,
      id: "66666666-6666-4666-8666-666666666661",
      tipo: "flyer",
      titulo: "Flyer da estreia",
      descricao: "Horário, endereço e o nome do espetáculo. Sem depoimento inventado.",
      prazo: hoje,
      responsavel_id: ID_USUARIO_EXEMPLO,
      status: "fazendo",
      concluido_em: null,
    },
    {
      ...base,
      id: "66666666-6666-4666-8666-666666666662",
      tipo: "story",
      titulo: "Story da fila",
      descricao: "Um quadro da entrada, se a foto for real.",
      prazo: somarDias(hoje, 2),
      responsavel_id: "00000000-0000-4000-8000-000000000002",
      status: "a_fazer",
      concluido_em: null,
    },
    {
      ...base,
      id: "66666666-6666-4666-8666-666666666663",
      tipo: "arte_feed",
      titulo: "Arte de feed da semana",
      descricao: null,
      prazo: segunda,
      responsavel_id: ID_USUARIO_EXEMPLO,
      status: "feito",
      concluido_em: "2026-11-18T18:00:00.000Z",
    },
    {
      ...base,
      id: "66666666-6666-4666-8666-666666666664",
      tipo: "video",
      titulo: "Vídeo curto do picadeiro",
      descricao: "Abre no trajeto da moto e fecha no picadeiro.",
      prazo: null,
      responsavel_id: null,
      status: "a_fazer",
      concluido_em: null,
    },
    {
      ...base,
      id: "66666666-6666-4666-8666-666666666665",
      tipo: "outro",
      titulo: "Cartaz da porta",
      descricao: "O mesmo horário do flyer, no tamanho da porta.",
      prazo: somarDias(segunda, -2),
      responsavel_id: null,
      status: "a_fazer",
      concluido_em: null,
    },
  ];
}

export function historicoExemplo(pecaId: string): ItemHistorico[] {
  if (pecaId !== "22222222-2222-4222-8222-222222222221") return [];
  return [
    {
      id: "55555555-5555-4555-8555-555555555551",
      peca_id: pecaId,
      autor_id: ID_USUARIO_EXEMPLO,
      campo: "status",
      antes: "em_producao",
      depois: "pronto",
      criado_em: "2026-11-18T16:00:00.000Z",
      autor_nome: "Prévia",
    },
  ];
}
