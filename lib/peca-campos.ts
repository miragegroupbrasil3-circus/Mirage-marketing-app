import type { Peca, Pilar, StatusPeca, TipoPeca } from "@/lib/tipos";

export type CamposPeca = {
  titulo: string;
  tipo: TipoPeca;
  data: string;
  horario: string;
  status: StatusPeca;
  pilar: Pilar;
  legenda: string;
  cta: string;
};

export function camposDePeca(peca: Pick<Peca, "titulo" | "tipo" | "data" | "horario" | "status" | "pilar" | "legenda" | "cta">): CamposPeca {
  return {
    titulo: peca.titulo,
    tipo: peca.tipo,
    data: peca.data,
    horario: peca.horario?.slice(0, 5) ?? "",
    status: peca.status,
    pilar: peca.pilar,
    legenda: peca.legenda,
    cta: peca.cta ?? "",
  };
}

export function camposNovos(data: string, status: StatusPeca = "ideia"): CamposPeca {
  return {
    titulo: "",
    tipo: "reels",
    data,
    horario: "",
    status,
    pilar: "espetaculo",
    legenda: "",
    cta: "",
  };
}

export function camposIguais(a: CamposPeca, b: CamposPeca) {
  return (
    a.titulo === b.titulo &&
    a.tipo === b.tipo &&
    a.data === b.data &&
    a.horario === b.horario &&
    a.status === b.status &&
    a.pilar === b.pilar &&
    a.legenda === b.legenda &&
    a.cta === b.cta
  );
}

function chaveTitulo(titulo: string) {
  return titulo.trim().toLowerCase().replaceAll("ç", "c");
}

export function mensagemTituloPeca(titulo: string) {
  const limpo = titulo.trim();
  if (!limpo) return "O título é obrigatório.";
  if (limpo.length > 180) return "O título pode ter no máximo 180 caracteres.";
  if (chaveTitulo(limpo) === "nova peca") return "Escolha um título próprio. “Nova peça” não entra no calendário.";
  return null;
}

export function mensagemHorario(horario: string) {
  const texto = horario.trim();
  if (!texto) return null;
  if (/^\d{2}:\d{2}$/.test(texto)) return null;
  return "Use o formato 18:00.";
}

export function validarCamposPeca(campos: CamposPeca) {
  return mensagemTituloPeca(campos.titulo) ?? mensagemHorario(campos.horario) ?? (campos.data ? null : "Informe a data.");
}

export function payloadPeca(campos: CamposPeca) {
  const horario = campos.horario.trim();
  return {
    titulo: campos.titulo.trim(),
    tipo: campos.tipo,
    data: campos.data,
    horario: horario || null,
    status: campos.status,
    pilar: campos.pilar,
    legenda: campos.legenda,
    cta: campos.cta.trim() || null,
  };
}
