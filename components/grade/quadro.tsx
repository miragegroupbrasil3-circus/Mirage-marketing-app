"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Moldura } from "@/components/marca/moldura";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { horarioCurto, rotuloDia, rotuloDiaCurto, rotuloNumero, somarDias } from "@/lib/datas";
import { slugPeca } from "@/lib/caminho";
import { ROTULO_PILAR, ROTULO_STATUS, ROTULO_TIPO } from "@/lib/rotulos";
import { cx } from "@/lib/cx";
import { FaixaProgresso } from "@/components/progresso/faixa";
import { COR_STATUS, COR_TIPO } from "@/lib/cores";
import type { PecaLista, StatusPeca } from "@/lib/tipos";
import { STATUS_PECA } from "@/lib/tipos";

export type PecaGrade = PecaLista;

type Visao = "dia" | "status";

const ORDEM_STATUS: StatusPeca[] = [...STATUS_PECA];

export function Quadro({
  iniciais,
  dias,
  visao,
  pracaId,
  preview,
  foco,
}: {
  iniciais: PecaGrade[];
  dias: string[];
  visao: Visao;
  pracaId: string;
  preview: boolean;
  foco: string;
}) {
  const chave = iniciais.map((peca) => `${peca.id}:${peca.data}:${peca.status}:${peca.ordem}:${peca.titulo}:${peca.horario}:${peca.concluido}:${peca.notas}`).join("|");
  return <QuadroVivo key={chave} iniciais={iniciais} dias={dias} visao={visao} pracaId={pracaId} preview={preview} foco={foco} />;
}

function QuadroVivo({
  iniciais,
  dias,
  visao,
  pracaId,
  preview,
  foco,
}: {
  iniciais: PecaGrade[];
  dias: string[];
  visao: Visao;
  pracaId: string;
  preview: boolean;
  foco: string;
}) {
  const router = useRouter();
  const [pecas, setPecas] = useState(iniciais);
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [estreito, setEstreito] = useState(false);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const aplicar = () => setEstreito(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`grade:${pracaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pecas", filter: `praca_id=eq.${pracaId}` }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [pracaId, preview, router]);

  const colunas = useMemo(() => {
    if (visao === "status") {
      return ORDEM_STATUS.map((status) => ({
        chave: `status:${status}`,
        titulo: ROTULO_STATUS[status],
        tituloCurto: ROTULO_STATUS[status],
        detalhe: "",
        idDom: undefined as string | undefined,
        pecas: pecas.filter((peca) => peca.status === status).sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, "pt-BR")),
      }));
    }
    return dias.map((dia) => ({
      chave: `dia:${dia}`,
      titulo: rotuloDia(dia),
      tituloCurto: rotuloDiaCurto(dia),
      detalhe: rotuloNumero(dia),
      idDom: dia,
      pecas: pecas.filter((peca) => peca.data === dia).sort((a, b) => a.ordem - b.ordem || (a.horario ?? "").localeCompare(b.horario ?? "")),
    }));
  }, [dias, pecas, visao]);

  const ativo = pecas.find((peca) => peca.id === ativoId) ?? null;

  function chaveDa(id: string) {
    if (id.startsWith("dia:") || id.startsWith("status:")) return id;
    const peca = pecas.find((item) => item.id === id);
    if (!peca) return null;
    return visao === "dia" ? `dia:${peca.data}` : `status:${peca.status}`;
  }

  function aoSoltar(evento: DragEndEvent) {
    setAtivoId(null);
    const { active, over } = evento;
    if (!over) return;

    const id = String(active.id);
    const peca = pecas.find((item) => item.id === id);
    if (!peca) return;

    let destino = chaveDa(String(over.id));
    if (String(over.id) === "mover:anterior" || String(over.id) === "mover:proximo") {
      destino = vizinho(peca, String(over.id) === "mover:proximo" ? 1 : -1);
    }
    const origem = chaveDa(id);
    if (!destino || !origem) return;

    const proximo = mover(pecas, id, origem, destino, String(over.id));
    setPecas(proximo);
    const mudou = proximo.find((item) => item.id === id);
    if (mudou) {
      setAnuncio(
        visao === "dia"
          ? `${mudou.titulo || "Peça"} foi para ${rotuloDia(mudou.data)}.`
          : `${mudou.titulo || "Peça"} está em ${ROTULO_STATUS[mudou.status]}.`,
      );
    }

    const alteradas = proximo.filter((item) => {
      const antes = pecas.find((original) => original.id === item.id);
      return !antes || antes.data !== item.data || antes.status !== item.status || antes.ordem !== item.ordem;
    });
    if (alteradas.length === 0 || preview) return;

    void guardar(alteradas).then((falhou) => {
      if (falhou) {
        setErro("Não foi possível guardar a mudança.");
        setPecas(pecas);
      }
    });
  }

  async function criar(data: string, status: StatusPeca) {
    setErro(null);
    const irmas = pecas.filter((peca) => (visao === "dia" ? peca.data === data : peca.status === status));
    const ordem = irmas.reduce((max, peca) => Math.max(max, peca.ordem), -1) + 1;
    const tipo = "reels" as const;
    if (preview) {
      const agora = new Date().toISOString();
      setPecas((atual) => [
        ...atual,
        {
          id: `local-${crypto.randomUUID()}`,
          praca_id: pracaId,
          semana_id: null,
          data,
          horario: null,
          tipo,
          titulo: "Nova peça",
          legenda: "",
          cta: null,
          pilar: "espetaculo",
          status,
          ordem,
          slug: slugPeca(tipo),
          criado_por: null,
          atualizado_por: null,
          concluido: false,
          concluido_por: null,
          concluido_em: null,
          criado_em: agora,
          atualizado_em: agora,
          midiaFinal: null,
          notas: 0,
        },
      ]);
      return;
    }

    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pecas").insert({
      praca_id: pracaId,
      data,
      tipo,
      titulo: "Nova peça",
      legenda: "",
      pilar: "espetaculo",
      status,
      ordem,
      slug: slugPeca(tipo),
    });
    if (error) {
      setErro("Não foi possível criar a peça.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      <div className="cartao-circo mb-8 rounded-3xl p-4">
        <FaixaProgresso
          feitas={pecas.filter((peca) => peca.concluido).length}
          total={pecas.length}
          rotulo="Concluídas nesta grade"
        />
      </div>
      {erro ? (
        <p role="alert" className="mb-4 text-gold">
          {erro}
        </p>
      ) : null}
      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragStart={(evento: DragStartEvent) => setAtivoId(String(evento.active.id))}
        onDragEnd={aoSoltar}
        onDragCancel={() => setAtivoId(null)}
      >
        <div className={cx("grid gap-10", visao === "dia" ? "md:grid-cols-7 md:gap-3" : "md:grid-cols-4 md:gap-6")}>
          {colunas.map((coluna) => (
            <Coluna
              key={coluna.chave}
              coluna={coluna}
              ocultaNoCelular={visao === "dia" && coluna.idDom !== foco}
              onCriar={() =>
                criar(
                  visao === "dia" ? coluna.chave.slice(4) : dias[0],
                  visao === "status" ? (coluna.chave.slice(7) as StatusPeca) : "ideia",
                )
              }
            />
          ))}
        </div>
        {ativoId && estreito && visao === "dia" ? <Bordas arrastando /> : null}
        <DragOverlay>{ativo ? <CartaoConteudo peca={ativo} overlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Bordas({ arrastando }: { arrastando: boolean }) {
  return (
    <>
      <Borda id="mover:anterior" lado="left" rotulo="Dia anterior" ativo={arrastando} />
      <Borda id="mover:proximo" lado="right" rotulo="Próximo dia" ativo={arrastando} />
    </>
  );
}

function Borda({ id, lado, rotulo, ativo }: { id: string; lado: "left" | "right"; rotulo: string; ativo: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cx(
        "fixed inset-y-24 z-30 flex w-16 items-center justify-center border border-dashed text-center text-sm md:hidden",
        lado === "left" ? "left-1" : "right-1",
        isOver || ativo ? "border-gold text-gold" : "border-transparent text-transparent",
      )}
    >
      {rotulo}
    </div>
  );
}

function Coluna({
  coluna,
  onCriar,
  ocultaNoCelular,
}: {
  coluna: { chave: string; titulo: string; tituloCurto?: string; detalhe: string; idDom?: string; pecas: PecaGrade[] };
  onCriar: () => void;
  ocultaNoCelular: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.chave });
  return (
    <section
      id={coluna.idDom ? `coluna-${coluna.idDom}` : undefined}
      className={cx("min-w-0", ocultaNoCelular && "hidden md:block")}
      aria-label={coluna.titulo}
    >
      <header className="mb-4">
        <h2 className="font-display text-3xl text-gold md:text-2xl">
          <span className="md:hidden">{coluna.titulo}</span>
          <span className="hidden md:inline">{coluna.tituloCurto ?? coluna.titulo}</span>
        </h2>
        {coluna.detalhe ? <p className="num mt-1 text-paper">{coluna.detalhe}</p> : null}
      </header>
      <div ref={setNodeRef} className={cx("min-h-40 border-t pt-3", isOver ? "border-gold" : "border-line-soft")}>
        <SortableContext items={coluna.pecas.map((peca) => peca.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-3">
            {coluna.pecas.map((peca) => (
              <li key={peca.id}>
                <Cartao peca={peca} />
              </li>
            ))}
          </ul>
        </SortableContext>
        {coluna.pecas.length === 0 ? (
          <p className="py-6 text-mist">{coluna.chave.startsWith("dia:") ? "Nada neste dia." : "Nada por aqui."}</p>
        ) : null}
        <button type="button" className="mt-3 min-h-11 text-mist" onClick={onCriar}>
          Nova peça
        </button>
      </div>
    </section>
  );
}

function Cartao({ peca }: { peca: PecaGrade }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: peca.id });
  const estilo = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <article ref={setNodeRef} style={estilo} className={cx("cartao-circo rounded-2xl", isDragging && "opacity-40")}>
      <div className="flex items-start">
        <button
          type="button"
          className="flex min-h-11 min-w-11 cursor-grab items-center justify-center text-gold"
          aria-label={`Arrastar ${peca.titulo || "peça"}`}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true" className="flex flex-col gap-1">
            <span className="block h-px w-3 bg-gold" />
            <span className="block h-px w-3 bg-gold" />
            <span className="block h-px w-3 bg-gold" />
          </span>
        </button>
        <Link href={`/pecas/${peca.id}`} className="min-w-0 flex-1 py-3 pr-3">
          <CartaoConteudo peca={peca} />
        </Link>
      </div>
    </article>
  );
}

function CartaoConteudo({ peca, overlay = false }: { peca: PecaGrade; overlay?: boolean }) {
  const midia = peca.midiaFinal;
  return (
    <span className={cx("block", overlay && "border border-gold bg-ink p-3")}>
      {midia?.url && midia.tipo === "imagem" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={midia.url} alt="" className="mb-2 h-16 w-full object-cover" />
      ) : (
        <Moldura className="mb-2 hidden h-14 w-10 md:block" />
      )}
      <span className="mb-2 block h-1 rounded-full" style={{ background: COR_TIPO[peca.tipo] }} />
      <span className="block text-paper">{peca.titulo || "Sem título"}</span>
      <span className="mt-2 flex flex-col text-sm text-mist">
        {horarioCurto(peca.horario) ? <span className="num">{horarioCurto(peca.horario)}</span> : null}
        <span>{ROTULO_TIPO[peca.tipo]}</span>
        <span>{ROTULO_PILAR[peca.pilar]}</span>
      </span>
      <span className="mt-2 flex items-center gap-2 text-sm" style={{ color: COR_STATUS[peca.status] }}>
        {ROTULO_STATUS[peca.status]}
        {peca.concluido ? <span className="text-gold">Concluída</span> : null}
        {peca.notas > 0 ? <span className="num rounded-full bg-magenta/20 px-2 text-magenta">{peca.notas}</span> : null}
      </span>
    </span>
  );
}

function vizinho(peca: PecaGrade, passo: number) {
  const data = somarDias(peca.data, passo);
  return `dia:${data}`;
}

function mover(pecas: PecaGrade[], id: string, origem: string, destino: string, sobre: string) {
  const peca = pecas.find((item) => item.id === id);
  if (!peca) return pecas;

  const atualizada: PecaGrade = { ...peca };
  if (destino.startsWith("dia:")) atualizada.data = destino.slice(4);
  if (destino.startsWith("status:")) atualizada.status = destino.slice(7) as StatusPeca;

  const daColuna = (chave: string, lista: PecaGrade[]) =>
    lista
      .filter((item) => (chave.startsWith("dia:") ? item.data === chave.slice(4) : item.status === chave.slice(7)))
      .sort((a, b) => a.ordem - b.ordem);

  const origemLista = daColuna(origem, pecas).filter((item) => item.id !== id);
  let destinoLista = origem === destino ? origemLista : daColuna(destino, pecas).filter((item) => item.id !== id);

  const indiceSobre = destinoLista.findIndex((item) => item.id === sobre);
  if (indiceSobre >= 0) destinoLista.splice(indiceSobre, 0, atualizada);
  else destinoLista = [...destinoLista, atualizada];

  if (origem === destino) {
    const lista = daColuna(origem, pecas);
    const de = lista.findIndex((item) => item.id === id);
    const para = indiceSobre >= 0 ? indiceSobre : Math.max(0, lista.length - 1);
    destinoLista = arrayMove(lista, de, para).map((item) => (item.id === id ? atualizada : item));
  }

  const comOrdem = (lista: PecaGrade[]) => lista.map((item, ordem) => ({ ...item, ordem }));
  const origemFinal = origem === destino ? comOrdem(destinoLista) : comOrdem(origemLista);
  const destinoFinal = comOrdem(destinoLista);
  const mapa = new Map(pecas.map((item) => [item.id, item]));
  for (const item of origemFinal) mapa.set(item.id, item);
  for (const item of destinoFinal) mapa.set(item.id, item);
  mapa.set(atualizada.id, destinoFinal.find((item) => item.id === id) ?? atualizada);
  return [...mapa.values()];
}

async function guardar(pecas: PecaGrade[]) {
  const supabase = criarClienteNavegador();
  const resultados = await Promise.all(
    pecas.map((peca) =>
      supabase.from("pecas").update({ data: peca.data, status: peca.status, ordem: peca.ordem }).eq("id", peca.id),
    ),
  );
  return resultados.some((resultado) => resultado.error);
}
