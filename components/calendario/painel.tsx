"use client";

import { useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { FolhaDia } from "@/components/calendario/folha";
import { Contador } from "@/components/motion/contador";
import { Inclinavel } from "@/components/motion/inclinavel";
import { Titulo } from "@/components/motion/titulo";
import { AnelProgresso } from "@/components/progresso/anel";
import { FaixaProgresso } from "@/components/progresso/faixa";
import { COR_STATUS, COR_TIPO, SIGLA_TIPO } from "@/lib/cores";
import { slugPeca } from "@/lib/caminho";
import {
  diasDaSemana,
  fimMes,
  mesDe,
  gradeDoMes,
  inicioMes,
  rotuloDiaCurto,
  rotuloDiaMes,
  rotuloMes,
  rotuloNumero,
  segundaDaSemana,
  somarMeses,
} from "@/lib/datas";
import { contagem, fraseHorizonte, horizonteDe, lacunas, noIntervalo, porPessoa, sequenciaDias } from "@/lib/progresso";
import { ROTULO_TIPO } from "@/lib/rotulos";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { cx } from "@/lib/cx";
import { TIPOS_PECA, type PecaLista, type ResumoPeca, type TipoPeca } from "@/lib/tipos";

const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function PainelCalendario({
  mes,
  diaInicial,
  pecas,
  resumo,
  hoje,
  pracaId,
  preview,
  autorNome,
  autorId,
  membros,
  cidade,
}: {
  mes: string;
  diaInicial: string | null;
  pecas: PecaLista[];
  resumo: ResumoPeca[];
  hoje: string;
  pracaId: string;
  preview: boolean;
  autorNome: string;
  autorId: string;
  membros: { id: string; nome: string }[];
  cidade: string;
}) {
  const router = useRouter();
  const assinaturaPecas = pecas.map((peca) => `${peca.id}:${peca.data}:${peca.titulo}:${peca.status}:${peca.tipo}:${peca.horario}:${peca.legenda}:${peca.concluido}:${peca.notas}`).join("|");
  const assinaturaResumo = resumo.map((peca) => `${peca.id}:${peca.data}:${peca.concluido}:${peca.status}:${peca.tipo}`).join("|");
  const [pecasLocais, setPecasLocais] = useState(pecas);
  const [resumoLocal, setResumoLocal] = useState(resumo);
  const [vistaPecas, setVistaPecas] = useState(assinaturaPecas);
  const [vistaResumo, setVistaResumo] = useState(assinaturaResumo);
  const [diaAberto, setDiaAberto] = useState(diaInicial);
  const [vistaDia, setVistaDia] = useState(diaInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [arrastando, setArrastando] = useState<string | null>(null);
  const silencio = useRef(0);
  const ponteiro = useRef<number | null>(null);

  if (assinaturaPecas !== vistaPecas) {
    setVistaPecas(assinaturaPecas);
    setPecasLocais(pecas);
  }
  if (assinaturaResumo !== vistaResumo) {
    setVistaResumo(assinaturaResumo);
    setResumoLocal(resumo);
  }
  if (diaInicial !== vistaDia) {
    setVistaDia(diaInicial);
    setDiaAberto(diaInicial);
  }

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const grade = useMemo(() => gradeDoMes(mes), [mes]);
  const horizonte = horizonteDe(resumoLocal);
  const primeiraData = resumoLocal.reduce<string | null>((min, peca) => (min == null || peca.data < min ? peca.data : min), null);
  const vazios = useMemo(() => new Set(lacunas(resumoLocal, hoje, horizonte)), [resumoLocal, hoje, horizonte]);
  const nomes = useMemo(() => new Map(membros.map((membro) => [membro.id, membro.nome])), [membros]);
  const semanaHoje = diasDaSemana(segundaDaSemana(hoje));
  const semanaRing = contagem(noIntervalo(resumoLocal, semanaHoje[0], semanaHoje[6]));
  const mesConta = contagem(noIntervalo(resumoLocal, inicioMes(mes), fimMes(mes)));
  const pracaConta = contagem(resumoLocal);
  const pessoas = porPessoa(resumoLocal, nomes);
  const sequencia = sequenciaDias(resumoLocal, hoje);
  const foco = diaAberto && grade.includes(diaAberto) ? diaAberto : grade.includes(hoje) ? hoje : (grade.find((dia) => dia.startsWith(mes)) ?? grade[0]);
  const faixa = diasDaSemana(segundaDaSemana(foco));
  const ativo = pecasLocais.find((peca) => peca.id === arrastando) ?? null;

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`calendario:${pracaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pecas", filter: `praca_id=eq.${pracaId}` }, () => {
        if (silencio.current === 0) router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comentarios" }, () => {
        if (silencio.current === 0) router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [pracaId, preview, router]);

  function silenciar() {
    silencio.current += 1;
    window.setTimeout(() => {
      silencio.current = Math.max(0, silencio.current - 1);
    }, 1200);
  }

  function abrir(dia: string) {
    setDiaAberto(dia);
    const params = new URLSearchParams(window.location.search);
    params.set("mes", mes);
    params.set("dia", dia);
    router.replace(`/calendario?${params.toString()}`, { scroll: false });
  }

  function fechar() {
    setDiaAberto(null);
    router.replace(`/calendario?mes=${mes}`, { scroll: false });
  }

  function irMes(delta: number) {
    router.push(`/calendario?mes=${somarMeses(mes, delta)}`, { scroll: false });
  }

  function aplicar(id: string, campo: string, valor: string | boolean | null) {
    setPecasLocais((atual) => atual.map((peca) => (peca.id === id ? alterar(peca, campo, valor, autorId) : peca)));
    setResumoLocal((atual) =>
      atual.map((peca) => {
        if (peca.id !== id) return peca;
        if (campo === "data" && typeof valor === "string") return { ...peca, data: valor };
        if (campo === "tipo" && typeof valor === "string") return { ...peca, tipo: valor as TipoPeca };
        if (campo === "status" && typeof valor === "string") return { ...peca, status: valor as ResumoPeca["status"] };
        if (campo === "titulo" && typeof valor === "string") return { ...peca, titulo: valor };
        if (campo === "concluido") return { ...peca, concluido: Boolean(valor), concluido_por: valor ? autorId : null };
        return peca;
      }),
    );
  }

  async function salvar(id: string, campo: string, valor: string | boolean | null) {
    setErro(null);
    aplicar(id, campo, valor);
    if (preview || id.startsWith("local-")) return null;
    silenciar();
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pecas").update({ [campo]: valor }).eq("id", id);
    if (error) {
      router.refresh();
      return "Não foi possível guardar.";
    }
    return null;
  }

  async function criar(data: string) {
    if (!pracaId) return;
    setErro(null);
    const agora = new Date().toISOString();
    const temporaria: PecaLista = {
      id: `local-${crypto.randomUUID()}`,
      praca_id: pracaId,
      semana_id: null,
      data,
      horario: null,
      tipo: "reels",
      titulo: "Nova peça",
      legenda: "",
      cta: null,
      pilar: "espetaculo",
      status: "ideia",
      concluido: false,
      concluido_por: null,
      concluido_em: null,
      ordem: pecasLocais.filter((peca) => peca.data === data).length,
      slug: slugPeca("reels"),
      criado_por: autorId || null,
      atualizado_por: autorId || null,
      criado_em: agora,
      atualizado_em: agora,
      midiaFinal: null,
      notas: 0,
    };
    setPecasLocais((atual) => [...atual, temporaria]);
    setResumoLocal((atual) => [
      ...atual,
      { id: temporaria.id, data, tipo: "reels", status: "ideia", concluido: false, concluido_por: null, titulo: "Nova peça" },
    ]);
    if (preview) return;
    silenciar();
    const supabase = criarClienteNavegador();
    const { data: criada, error } = await supabase
      .from("pecas")
      .insert({
        praca_id: pracaId,
        data,
        tipo: "reels",
        titulo: "Nova peça",
        legenda: "",
        pilar: "espetaculo",
        status: "ideia",
        ordem: temporaria.ordem,
        slug: temporaria.slug,
      })
      .select("id")
      .single();
    if (error || !criada) {
      setPecasLocais((atual) => atual.filter((peca) => peca.id !== temporaria.id));
      setResumoLocal((atual) => atual.filter((peca) => peca.id !== temporaria.id));
      setErro("Não foi possível criar a peça.");
      return;
    }
    setPecasLocais((atual) => atual.map((peca) => (peca.id === temporaria.id ? { ...peca, id: criada.id } : peca)));
    setResumoLocal((atual) => atual.map((peca) => (peca.id === temporaria.id ? { ...peca, id: criada.id } : peca)));
  }

  function aoSoltar(evento: DragEndEvent) {
    setArrastando(null);
    const destino = evento.over ? String(evento.over.id) : "";
    if (!destino.startsWith("dia:")) return;
    const data = destino.slice(4);
    const id = String(evento.active.id);
    const peca = pecasLocais.find((item) => item.id === id);
    if (!peca || peca.data === data) return;
    setAnuncio(`${peca.titulo || "Peça"} foi para ${rotuloDiaMes(data)}.`);
    void salvar(id, "data", data);
  }

  const doDia = diaAberto ? pecasLocais.filter((peca) => peca.data === diaAberto).sort(ordenar) : [];

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Titulo>Calendário</Titulo>
          <p className="mt-3 text-paper">{cidade}</p>
        </div>
        <p className="cartao-circo inline-flex max-w-xl items-center rounded-full px-4 py-2 text-gold">{fraseHorizonte(horizonte, hoje)}</p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[auto_1fr_16rem]">
        <Inclinavel className="cartao-circo rounded-3xl p-4">
          <AnelProgresso feitas={semanaRing.feitas} total={semanaRing.total} rotulo="Esta semana" />
        </Inclinavel>
        <Inclinavel className="cartao-circo flex flex-col justify-center gap-4 rounded-3xl p-4">
          <FaixaProgresso feitas={mesConta.feitas} total={mesConta.total} rotulo="Este mês" />
          <FaixaProgresso feitas={pracaConta.feitas} total={pracaConta.total} rotulo="Nesta praça" />
        </Inclinavel>
        <Inclinavel className="cartao-circo rounded-3xl p-4">
          <p className="text-sm text-mist">Sequência</p>
          {sequencia === 0 ? (
            <p className="texto mt-2 text-sm text-paper">A sequência começa no dia em que todas as peças ficam concluídas.</p>
          ) : (
            <p className="font-display mt-1 text-4xl text-gold">
              <Contador valor={sequencia} /> <span className="text-lg text-paper">dias</span>
            </p>
          )}
          <Contribuicao pessoas={pessoas} />
        </Inclinavel>
      </div>

      <div
        className="mt-8 flex items-center justify-between gap-3"
        onPointerDown={(evento) => {
          ponteiro.current = evento.clientX;
        }}
        onPointerUp={(evento) => {
          if (ponteiro.current == null) return;
          const delta = evento.clientX - ponteiro.current;
          ponteiro.current = null;
          if (delta < -48) irMes(1);
          if (delta > 48) irMes(-1);
        }}
      >
        <Link href={`/calendario?mes=${somarMeses(mes, -1)}`} scroll={false} className="botao shrink-0 px-3 text-sm">
          Anterior
        </Link>
        <h2 className="font-display flex min-w-0 flex-col items-center px-1 text-center text-xl leading-none text-paper sm:flex-row sm:text-3xl">
          <span className="capitalize">{rotuloMes(mes).replace(/\s+de\s+.+$/i, "")}</span>
          <span className="text-gold sm:mx-2">{mes.slice(0, 4)}</span>
        </h2>
        <Link href={`/calendario?mes=${somarMeses(mes, 1)}`} scroll={false} className="botao shrink-0 px-3 text-sm">
          Próximo
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto md:hidden">
        {faixa.map((dia) => {
          const itens = pecasLocais.filter((peca) => peca.data === dia);
          return (
            <Link
              key={dia}
              href={`/calendario?mes=${mesDe(dia)}&dia=${dia}`}
              scroll={false}
              onClick={() => abrir(dia)}
              className={cx(
                "min-w-14 flex-1 rounded-2xl border px-1 py-2",
                dia === foco ? "border-gold text-gold" : "border-white/10 text-paper",
                vazios.has(dia) && "border-dashed border-crimson",
              )}
            >
              <span className="block text-[0.7rem] uppercase">{rotuloDiaCurto(dia)}</span>
              <span className="num block text-lg">{rotuloNumero(dia)}</span>
              <span className="mt-1 flex justify-center gap-0.5">
                {itens.slice(0, 3).map((peca) => (
                  <span key={peca.id} className="h-1.5 w-1.5 rounded-full" style={{ background: COR_TIPO[peca.tipo] }} />
                ))}
              </span>
            </Link>
          );
        })}
      </div>

      <Legenda />
      {vazios.size > 0 ? (
        <p className="mt-3 text-sm text-crimson">Dias tracejados são lacunas: ainda sem peça, dentro do que já está planejado.</p>
      ) : null}
      {erro ? (
        <p role="alert" className="mt-3 text-gold">
          {erro}
        </p>
      ) : null}

      <DndContext id="calendario" sensors={sensores} collisionDetection={closestCenter} onDragStart={(evento) => setArrastando(String(evento.active.id))} onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
        <div className="mt-4 grid grid-cols-7 gap-1 md:gap-2">
          {SEMANA.map((nome) => (
            <div key={nome} className="pb-1 text-center text-[0.7rem] uppercase tracking-wide text-mist">
              {nome}
            </div>
          ))}
          {grade.map((dia) => (
            <Celula
              key={dia}
              dia={dia}
              mes={mes}
              hoje={hoje}
              pecas={pecasLocais.filter((peca) => peca.data === dia).sort(ordenar)}
              lacuna={vazios.has(dia)}
              noHorizonte={Boolean(primeiraData && horizonte && dia >= primeiraData && dia <= horizonte)}
              onAbrir={() => abrir(dia)}
            />
          ))}
        </div>
        <DragOverlay>{ativo ? <ChipVisual peca={ativo} overlay /> : null}</DragOverlay>
      </DndContext>

      <FolhaDia
        dia={diaAberto}
        pecas={doDia}
        lacuna={diaAberto ? vazios.has(diaAberto) : false}
        preview={preview}
        autorNome={autorNome}
        onFechar={fechar}
        onSalvar={salvar}
        onCriar={() => {
          if (diaAberto) void criar(diaAberto);
        }}
      />
    </div>
  );
}

function alterar(peca: PecaLista, campo: string, valor: string | boolean | null, autorId: string): PecaLista {
  if (campo === "concluido") {
    const concluido = Boolean(valor);
    return {
      ...peca,
      concluido,
      concluido_por: concluido ? autorId || null : null,
      concluido_em: concluido ? new Date().toISOString() : null,
    };
  }
  return { ...peca, [campo]: valor };
}

function ordenar(a: PecaLista, b: PecaLista) {
  return (a.horario ?? "99:99").localeCompare(b.horario ?? "99:99") || a.ordem - b.ordem;
}

function Contribuicao({ pessoas }: { pessoas: { id: string; nome: string; total: number }[] }) {
  if (pessoas.length === 0) {
    return <p className="mt-3 text-sm text-mist">Ninguém concluiu uma peça ainda.</p>;
  }
  return (
    <ul className="mt-3 flex flex-col gap-1 text-sm">
      {pessoas.map((pessoa) => (
        <li key={pessoa.id} className="flex justify-between gap-3 text-paper">
          <span>{pessoa.nome}</span>
          <span className="text-gold">
            <Contador valor={pessoa.total} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Legenda() {
  return (
    <ul className="mt-4 flex flex-wrap gap-3 text-sm text-paper">
      {TIPOS_PECA.map((tipo) => (
        <li key={tipo} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_TIPO[tipo] }} />
          {ROTULO_TIPO[tipo]}
        </li>
      ))}
    </ul>
  );
}

function Celula({
  dia,
  mes,
  hoje,
  pecas,
  lacuna,
  noHorizonte,
  onAbrir,
}: {
  dia: string;
  mes: string;
  hoje: string;
  pecas: PecaLista[];
  lacuna: boolean;
  noHorizonte: boolean;
  onAbrir: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `dia:${dia}` });
  const fora = !dia.startsWith(mes);
  return (
    <div
      ref={setNodeRef}
      onClick={onAbrir}
      className={cx(
        "flex min-h-16 flex-col rounded-xl border border-white/10 p-1 md:min-h-28 md:p-2",
        dia === hoje && "ring-1 ring-gold",
        lacuna && "border-dashed border-crimson",
        noHorizonte && "bg-gold/10",
        isOver && "border-turquoise bg-turquoise/10",
        fora && "opacity-35",
      )}
    >
      <Link
        href={`/calendario?mes=${mes}&dia=${dia}`}
        scroll={false}
        onClick={onAbrir}
        className="num self-start px-1 text-left text-sm text-paper"
        aria-label={rotuloAcessivel(dia, pecas, lacuna)}
      >
        {rotuloNumero(dia)}
      </Link>
      <div className="mt-1 flex flex-wrap gap-1">
        {pecas.slice(0, 4).map((peca) => (
          <Chip key={peca.id} peca={peca} onAbrir={onAbrir} />
        ))}
        {pecas.length > 4 ? <span className="num text-xs text-mist">+{pecas.length - 4}</span> : null}
      </div>
    </div>
  );
}

function rotuloAcessivel(dia: string, pecas: PecaLista[], lacuna: boolean) {
  const base = `${rotuloDiaMes(dia)}, ${pecas.length === 0 ? "sem peças" : `${pecas.length} ${pecas.length === 1 ? "peça" : "peças"}`}`;
  return lacuna ? `${base}. Lacuna no horizonte.` : base;
}

function Chip({ peca, onAbrir }: { peca: PecaLista; onAbrir: () => void }) {
  const arraste = useDraggable({ id: peca.id });
  return (
    <ChipVisual
      peca={peca}
      onAbrir={onAbrir}
      arrastando={arraste.isDragging}
      refNo={arraste.setNodeRef}
      atributos={arraste.attributes}
      ouvintes={arraste.listeners}
    />
  );
}

function ChipVisual({
  peca,
  overlay = false,
  arrastando = false,
  onAbrir,
  refNo,
  atributos,
  ouvintes,
}: {
  peca: PecaLista;
  overlay?: boolean;
  arrastando?: boolean;
  onAbrir?: () => void;
  refNo?: (elemento: HTMLElement | null) => void;
  atributos?: HTMLAttributes<HTMLButtonElement>;
  ouvintes?: HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={refNo}
      data-peca="1"
      aria-label={`Arrastar ${peca.titulo || "peça"}`}
      className={cx(
        "relative flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[0.65rem] font-semibold text-ink",
        arrastando && "opacity-30",
        overlay && "px-3",
        peca.concluido && "outline outline-1 outline-white",
      )}
      style={{ background: COR_TIPO[peca.tipo], boxShadow: `inset 0 -3px 0 ${COR_STATUS[peca.status]}` }}
      {...atributos}
      {...ouvintes}
      onClick={(evento) => {
        evento.stopPropagation();
        ouvintes?.onClick?.(evento);
        onAbrir?.();
      }}
    >
      <span className="hidden md:inline">{SIGLA_TIPO[peca.tipo]}</span>
      <span className="md:hidden h-2 w-2 rounded-full bg-ink/30" aria-hidden="true" />
      {peca.notas > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] text-gold">
          {peca.notas}
        </span>
      ) : null}
      {overlay ? <span className="ml-1 max-w-40 truncate">{peca.titulo || "Peça"}</span> : null}
    </button>
  );
}
