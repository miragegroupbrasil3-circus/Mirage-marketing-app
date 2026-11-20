import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { slugPeca } from "@/lib/caminho";
import { mensagemTituloPeca } from "@/lib/peca-campos";
import { criarClienteServico } from "@/lib/supabase/admin";
import { PILARES, STATUS_PECA, TIPOS_PECA } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Corpo = {
  praca_id?: string;
  data?: string;
  horario?: string | null;
  tipo?: string;
  titulo?: string;
  legenda?: string;
  cta?: string | null;
  pilar?: string;
  status?: string;
};

export async function POST(request: Request) {
  const admin = criarClienteServico();
  if (!admin) {
    return NextResponse.json(
      { erro: "Serviço indisponível. Falta SUPABASE_SERVICE_ROLE_KEY no servidor." },
      { status: 503 },
    );
  }

  const cabecalho = request.headers.get("authorization") ?? "";
  const chave = cabecalho.toLowerCase().startsWith("bearer ") ? cabecalho.slice(7).trim() : "";
  if (!chave) {
    return NextResponse.json({ erro: "Chave ausente." }, { status: 401 });
  }

  const hash = createHash("sha256").update(chave).digest("hex");
  const { data: bots, error: erroBusca } = await admin
    .from("registro_bots")
    .select("id, chave_hash, ativo")
    .eq("chave_hash", hash)
    .eq("ativo", true)
    .limit(1);

  if (erroBusca) {
    return NextResponse.json({ erro: "Não foi possível validar a chave." }, { status: 500 });
  }

  const bot = bots?.[0];
  const armazenado = Buffer.from(bot?.chave_hash ?? "");
  const calculado = Buffer.from(hash);
  const confere = armazenado.length === calculado.length && timingSafeEqual(armazenado, calculado);
  if (!bot || !confere) {
    return NextResponse.json({ erro: "Chave recusada." }, { status: 401 });
  }

  let bruto: Record<string, unknown>;
  try {
    const lido: unknown = await request.json();
    if (!lido || typeof lido !== "object" || Array.isArray(lido)) {
      return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
    }
    bruto = lido as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  if ("concluido" in bruto || "concluido_por" in bruto || "concluido_em" in bruto) {
    return NextResponse.json(
      { erro: "Bots não marcam peça como concluída. Só uma pessoa da equipe conclui." },
      { status: 400 },
    );
  }

  const corpo = bruto as Corpo;

  const tipo = corpo.tipo ?? "reels";
  const pilar = corpo.pilar ?? "espetaculo";
  const status = corpo.status ?? "ideia";
  if (!corpo.praca_id || !corpo.data || !/^\d{4}-\d{2}-\d{2}$/.test(corpo.data)) {
    return NextResponse.json({ erro: "Informe praca_id e data (AAAA-MM-DD)." }, { status: 400 });
  }
  if (!TIPOS_PECA.includes(tipo as (typeof TIPOS_PECA)[number])) {
    return NextResponse.json({ erro: "Formato desconhecido." }, { status: 400 });
  }
  if (!PILARES.includes(pilar as (typeof PILARES)[number])) {
    return NextResponse.json({ erro: "Pilar desconhecido." }, { status: 400 });
  }
  if (!STATUS_PECA.includes(status as (typeof STATUS_PECA)[number])) {
    return NextResponse.json({ erro: "Estado desconhecido." }, { status: 400 });
  }
  const titulo = typeof corpo.titulo === "string" ? corpo.titulo : "";
  const erroTitulo = mensagemTituloPeca(titulo);
  if (erroTitulo) {
    return NextResponse.json({ erro: erroTitulo }, { status: 400 });
  }

  const { data: criada, error } = await admin
    .from("pecas")
    .insert({
      praca_id: corpo.praca_id,
      data: corpo.data,
      horario: corpo.horario || null,
      tipo,
      titulo: titulo.trim(),
      legenda: corpo.legenda ?? "",
      cta: corpo.cta || null,
      pilar,
      status,
      slug: slugPeca(tipo),
    })
    .select("id")
    .single();

  if (error || !criada) {
    return NextResponse.json({ erro: "Não foi possível criar a peça." }, { status: 400 });
  }

  await admin.from("registro_bots").update({ ultimo_uso_em: new Date().toISOString() }).eq("id", bot.id);

  return NextResponse.json({ id: criada.id }, { status: 201 });
}
