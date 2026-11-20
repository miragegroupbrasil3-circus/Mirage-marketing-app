const FUSO = "America/Sao_Paulo";

export function hojeISO(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

function dataUtc(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function formatarISO(data: Date) {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function somarDias(iso: string, dias: number) {
  const data = dataUtc(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return formatarISO(data);
}

export function segundaDaSemana(iso: string) {
  const data = dataUtc(iso);
  const dia = data.getUTCDay() || 7;
  data.setUTCDate(data.getUTCDate() - (dia - 1));
  return formatarISO(data);
}

export function diasDaSemana(segunda: string) {
  return Array.from({ length: 7 }, (_, indice) => somarDias(segunda, indice));
}

export function semanaIso(iso: string) {
  const data = dataUtc(iso);
  const dia = data.getUTCDay() || 7;
  data.setUTCDate(data.getUTCDate() + 4 - dia);
  const ano = data.getUTCFullYear();
  const inicio = new Date(Date.UTC(ano, 0, 1));
  const semana = Math.ceil(((data.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
  return `${ano}-W${String(semana).padStart(2, "0")}`;
}

export function rotuloSemana(segunda: string) {
  const domingo = somarDias(segunda, 6);
  const inicio = dataUtc(segunda);
  const fim = dataUtc(domingo);
  const mesmoMes = inicio.getUTCMonth() === fim.getUTCMonth();
  const diaInicio = new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: "UTC" }).format(inicio);
  const diaFim = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(fim);
  if (mesmoMes) {
    const mes = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(fim);
    return `${diaInicio} a ${new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: "UTC" }).format(fim)} de ${mes}`;
  }
  const inicioLongo = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(inicio);
  return `${inicioLongo} a ${diaFim}`;
}

export function rotuloDia(iso: string) {
  const nome = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(dataUtc(iso));
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function rotuloDiaCurto(iso: string) {
  const nome = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(dataUtc(iso));
  return nome.replace(".", "");
}

export function rotuloData(iso: string) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dataUtc(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloNumero(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: "UTC" }).format(dataUtc(iso));
}

export function horarioCurto(horario: string | null) {
  if (!horario) return null;
  return horario.slice(0, 5);
}

export function quando(iso: string) {
  const data = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
  }).format(data);
}

export function tempoRelativo(iso: string, agora = new Date()) {
  const delta = agora.getTime() - new Date(iso).getTime();
  const minutos = Math.round(delta / 60000);
  if (!Number.isFinite(minutos)) return quando(iso);
  if (minutos < 1) return "agora";
  if (minutos < 60) return minutos === 1 ? "há 1 min" : `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return horas === 1 ? "há 1 h" : `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
  return quando(iso);
}

export function mesDe(iso: string) {
  return iso.slice(0, 7);
}

export function inicioMes(mes: string) {
  return `${mes}-01`;
}

export function fimMes(mes: string) {
  const [ano, mesNumero] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mesNumero, 0)).getUTCDate();
  return `${mes}-${String(ultimo).padStart(2, "0")}`;
}

export function somarMeses(mes: string, delta: number) {
  const [ano, mesNumero] = mes.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mesNumero - 1 + delta, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function gradeDoMes(mes: string) {
  const primeira = segundaDaSemana(inicioMes(mes));
  const ultima = somarDias(segundaDaSemana(fimMes(mes)), 6);
  const dias: string[] = [];
  for (let dia = primeira; dia <= ultima; dia = somarDias(dia, 1)) dias.push(dia);
  return dias;
}

export function rotuloMes(mes: string) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dataUtc(inicioMes(mes)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloDiaMes(iso: string) {
  const data = dataUtc(iso);
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}
