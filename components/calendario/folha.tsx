"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BotaoConcluir } from "@/components/peca/concluir";
import { Notas } from "@/components/peca/notas";
import { comentariosExemplo } from "@/lib/exemplo";
import { COR_TIPO } from "@/lib/cores";
import { rotuloData, rotuloDiaMes } from "@/lib/datas";
import { ROTULO_STATUS, ROTULO_TIPO } from "@/lib/rotulos";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { STATUS_PECA, TIPOS_PECA, type Comentario, type PecaLista, type StatusPeca, type TipoPeca } from "@/lib/tipos";

function normalizarHorario(valor: string) {
  const texto = valor.trim();
  if (!texto) return null;
  if (/^\d{2}:\d{2}$/.test(texto)) return texto;
  return undefined;
}

export function FolhaDia({
  dia,
  pecas,
  lacuna,
  preview,
  autorNome,
  onFechar,
  onSalvar,
  onCriar,
}: {
  dia: string | null;
  pecas: PecaLista[];
  lacuna: boolean;
  preview: boolean;
  autorNome: string;
  onFechar: () => void;
  onSalvar: (id: string, campo: string, valor: string | boolean | null) => Promise<string | null>;
  onCriar: () => void;
}) {
  const reduzir = useReducedMotion();
  const [noCorpo, setNoCorpo] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setNoCorpo(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!dia) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [dia, onFechar]);

  const arvore = (
    <AnimatePresence>
      {dia ? (
        <div className="fixed inset-0 z-[60]">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fechar o dia" onClick={onFechar} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="folha-titulo"
            initial={reduzir ? false : { y: 28 }}
            animate={{ y: 0 }}
            exit={reduzir ? undefined : { y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="cartao-circo absolute inset-x-0 bottom-0 z-10 max-h-[86dvh] overflow-y-auto rounded-t-3xl border-gold/40 p-5 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[32rem] md:rounded-none md:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-magenta">Dia</p>
                <h2 id="folha-titulo" className="font-display mt-1 text-3xl text-gold">
                  {rotuloData(dia)}
                </h2>
                {lacuna ? <p className="mt-2 text-sm text-crimson">Lacuna: este dia ainda não tem peça, e o horizonte passa daqui.</p> : null}
              </div>
              <button type="button" className="botao" onClick={onFechar} autoFocus>
                Fechar
              </button>
            </div>

            {pecas.length === 0 ? (
              <p className="texto text-paper">Nada planejado em {rotuloDiaMes(dia)}.</p>
            ) : (
              <ul className="flex flex-col gap-6">
                {pecas.map((peca) => (
                  <li key={peca.id} className="rounded-2xl border border-white/10 p-4">
                    <PecaRapida peca={peca} preview={preview} autorNome={autorNome} onSalvar={onSalvar} />
                  </li>
                ))}
              </ul>
            )}

            <button type="button" className="botao mt-6" onClick={onCriar}>
              Nova peça
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  if (noCorpo && typeof document !== "undefined") return createPortal(arvore, document.body);
  return arvore;
}

function PecaRapida({
  peca,
  preview,
  autorNome,
  onSalvar,
}: {
  peca: PecaLista;
  preview: boolean;
  autorNome: string;
  onSalvar: (id: string, campo: string, valor: string | boolean | null) => Promise<string | null>;
}) {
  const [titulo, setTitulo] = useState(peca.titulo);
  const [texto, setTexto] = useState(peca.legenda);
  const [horario, setHorario] = useState(peca.horario?.slice(0, 5) ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [notas, setNotas] = useState<Comentario[] | null>(preview ? comentariosExemplo(peca.id) : null);

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    let vivo = true;
    void (async () => {
      const resposta = await supabase
        .from("comentarios")
        .select("id, peca_id, autor_id, texto, criado_em, perfis(nome)")
        .eq("peca_id", peca.id)
        .order("criado_em", { ascending: true });
      if (!vivo) return;
      const linhas = ((resposta as { data?: Record<string, unknown>[] | null }).data ?? []) as Record<string, unknown>[];
      setNotas(
        linhas.map((linha) => {
          const perfil = linha.perfis as { nome?: string } | { nome?: string }[] | null;
          const nome = Array.isArray(perfil) ? perfil[0]?.nome : perfil?.nome;
          return {
            id: String(linha.id),
            peca_id: String(linha.peca_id),
            autor_id: linha.autor_id == null ? null : String(linha.autor_id),
            texto: String(linha.texto),
            criado_em: String(linha.criado_em),
            autor_nome: nome || "Equipe",
          };
        }),
      );
    })();
    return () => {
      vivo = false;
    };
  }, [peca.id, preview]);

  async function guardar(campo: string, valor: string | boolean | null) {
    const falha = await onSalvar(peca.id, campo, valor);
    setErro(falha);
    return falha;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-ink" style={{ background: COR_TIPO[peca.tipo] }}>
          {ROTULO_TIPO[peca.tipo]}
        </span>
        <Link href={`/pecas/${peca.id}`} className="link text-sm">
          Abrir peça
        </Link>
      </div>
      <label className="text-sm text-mist" htmlFor={`titulo-${peca.id}`}>
        Título
      </label>
      <input
        id={`titulo-${peca.id}`}
        className="campo font-display text-2xl text-gold"
        value={titulo}
        maxLength={180}
        onChange={(evento) => setTitulo(evento.target.value)}
        onBlur={() => {
          if (titulo !== peca.titulo) void guardar("titulo", titulo);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Data">
          <input
            type="date"
            className="campo num"
            defaultValue={peca.data}
            onChange={(evento) => {
              if (evento.target.value) void guardar("data", evento.target.value);
            }}
          />
        </Campo>
        <Campo rotulo="Horário">
          <input
            className="campo num"
            value={horario}
            placeholder="18:00"
            onChange={(evento) => setHorario(evento.target.value)}
            onBlur={() => {
              const normal = normalizarHorario(horario);
              if (normal === undefined) {
                setErro("Use o formato 18:00.");
                return;
              }
              if ((peca.horario?.slice(0, 5) ?? "") !== (normal ?? "")) void guardar("horario", normal);
            }}
          />
        </Campo>
        <Campo rotulo="Formato">
          <select className="campo" value={peca.tipo} onChange={(evento) => void guardar("tipo", evento.target.value as TipoPeca)}>
            {TIPOS_PECA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ROTULO_TIPO[tipo]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Estado">
          <select className="campo" value={peca.status} onChange={(evento) => void guardar("status", evento.target.value as StatusPeca)}>
            {STATUS_PECA.map((status) => (
              <option key={status} value={status}>
                {ROTULO_STATUS[status]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo rotulo="Texto / roteiro">
        <textarea
          className="campo"
          value={texto}
          maxLength={5000}
          onChange={(evento) => setTexto(evento.target.value)}
          onBlur={() => {
            if (texto !== peca.legenda) void guardar("legenda", texto);
          }}
        />
      </Campo>
      <BotaoConcluir concluido={peca.concluido} onMudar={(valor) => guardar("concluido", valor)} />
      {notas ? (
        <Notas pecaId={peca.id} iniciais={notas} preview={preview} autorNome={autorNome} />
      ) : (
        <div className="esqueleto h-16" aria-hidden="true" />
      )}
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <p className="text-sm text-mist">Cada alteração entra no histórico da peça.</p>
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-mist">
      {rotulo}
      {children}
    </label>
  );
}
