"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, useDragControls, useReducedMotion } from "framer-motion";
import { BarraSalvar, CamposPecaForm } from "@/components/peca/campos";
import { BotaoConcluir } from "@/components/peca/concluir";
import { Notas } from "@/components/peca/notas";
import { Confirmar } from "@/components/ui/confirmar";
import { comentariosExemplo } from "@/lib/exemplo";
import { COR_TIPO } from "@/lib/cores";
import { rotuloData } from "@/lib/datas";
import { ROTULO_TIPO } from "@/lib/rotulos";
import { camposDePeca, camposIguais, camposNovos, validarCamposPeca, type CamposPeca } from "@/lib/peca-campos";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Comentario, PecaLista } from "@/lib/tipos";

export function FolhaDia({
  dia,
  pecas,
  lacuna,
  preview,
  autorNome,
  onFechar,
  onGuardar,
  onConcluir,
  onCriar,
  onExcluir,
}: {
  dia: string | null;
  pecas: PecaLista[];
  lacuna: boolean;
  preview: boolean;
  autorNome: string;
  onFechar: () => void;
  onGuardar: (id: string, campos: CamposPeca) => Promise<string | null>;
  onConcluir: (id: string, valor: boolean) => Promise<string | null>;
  onCriar: (campos: CamposPeca) => Promise<string | null>;
  onExcluir: (id: string) => void;
}) {
  const reduzir = useReducedMotion();
  const controles = useDragControls();
  const [noCorpo, setNoCorpo] = useState(false);
  const [rascunhoAberto, setRascunhoAberto] = useState(false);
  const [diaVisto, setDiaVisto] = useState<string | null>(null);
  const [sujos, setSujos] = useState<Record<string, boolean>>({});
  const [descarte, setDescarte] = useState<"folha" | "rascunho" | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  if (dia !== diaVisto) {
    setDiaVisto(dia);
    setRascunhoAberto(Boolean(dia) && pecas.length === 0);
    setSujos({});
    setDescarte(null);
  }

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setNoCorpo(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const haRascunhoSujo = Boolean(sujos.nova);
  const haAlteracao = Object.values(sujos).some(Boolean);
  const marcarSujo = useCallback((id: string, sujo: boolean) => {
    setSujos((atual) => {
      if (Boolean(atual[id]) === sujo) return atual;
      return { ...atual, [id]: sujo };
    });
  }, []);

  function pedirFechar() {
    if (haAlteracao) setDescarte("folha");
    else onFechar();
  }

  useEffect(() => {
    if (!dia) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      if (Object.values(sujos).some(Boolean)) setDescarte("folha");
      else onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [dia, onFechar, sujos]);

  const arvore = (
    <>
      {dia ? (
        <div className="fixed inset-0 z-[60]">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fechar o dia" onClick={pedirFechar} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="folha-titulo"
            drag={reduzir ? false : "y"}
            dragControls={controles}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96) pedirFechar();
            }}
            initial={reduzir ? false : { y: 28 }}
            animate={{ y: 0 }}
            className="cartao-circo absolute inset-x-0 bottom-0 z-10 max-h-[86dvh] overflow-y-auto rounded-t-3xl border-gold/40 p-5 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[32rem] md:rounded-none md:p-8"
          >
            <div
              className="mx-auto mb-4 h-1.5 w-14 cursor-grab rounded-full bg-gold/50 md:hidden"
              aria-hidden="true"
              onPointerDown={(evento) => controles.start(evento)}
            />
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-magenta">Dia</p>
                <h2 id="folha-titulo" className="font-display mt-1 text-3xl text-gold">
                  {rotuloData(dia)}
                </h2>
                {lacuna ? <p className="mt-2 text-sm text-crimson">Lacuna: este dia ainda não tem peça, e o horizonte passa daqui.</p> : null}
              </div>
              <button type="button" className="botao" onClick={pedirFechar}>
                Fechar
              </button>
            </div>

            {pecas.length === 0 && !rascunhoAberto ? <p className="texto text-paper">Nada planejado neste dia.</p> : null}

            {rascunhoAberto ? (
              <RascunhoInline
                data={dia}
                onSujo={(sujo) => marcarSujo("nova", sujo)}
                onCancelar={() => {
                  if (sujos.nova) setDescarte("rascunho");
                  else setRascunhoAberto(false);
                }}
                onCriar={async (campos) => {
                  const falha = await onCriar(campos);
                  if (!falha) {
                    setRascunhoAberto(false);
                    setSujos((atual) => ({ ...atual, nova: false }));
                  }
                  return falha;
                }}
              />
            ) : null}

            {pecas.length > 0 ? (
              <ul className="mt-6 flex flex-col gap-6">
                {pecas.map((peca) => (
                  <li key={peca.id} className="rounded-2xl border border-white/10 p-4">
                    <PecaRapida
                      peca={peca}
                      preview={preview}
                      autorNome={autorNome}
                      onSujo={(sujo) => marcarSujo(peca.id, sujo)}
                      onGuardar={onGuardar}
                      onConcluir={onConcluir}
                      onPedirExclusao={() => setExcluirId(peca.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}

            {rascunhoAberto ? null : (
              <button type="button" className="botao mt-6" onClick={() => setRascunhoAberto(true)}>
                Nova peça
              </button>
            )}
          </motion.div>
        </div>
      ) : null}
      <Confirmar
        aberto={descarte != null}
        titulo={haRascunhoSujo ? "Descartar rascunho?" : "Descartar alterações?"}
        texto={haRascunhoSujo ? "O que você digitou sai desta tela e não entra no calendário." : "As alterações desta peça ainda não foram salvas."}
        confirmar="Descartar"
        onCancelar={() => setDescarte(null)}
        onConfirmar={() => {
          const modo = descarte;
          setDescarte(null);
          setSujos((atual) => ({ ...atual, nova: false }));
          setRascunhoAberto(false);
          if (modo === "folha") onFechar();
        }}
      />
      <Confirmar
        aberto={excluirId != null}
        titulo="Excluir peça?"
        texto="A peça sai do calendário. Se era a única do dia, o dia fica vazio de novo. Comentários, histórico e arquivos também são removidos. O progresso recalcula."
        confirmar="Excluir peça"
        onCancelar={() => setExcluirId(null)}
        onConfirmar={() => {
          if (excluirId) onExcluir(excluirId);
          setExcluirId(null);
        }}
      />
    </>
  );

  if (noCorpo && typeof document !== "undefined") return createPortal(arvore, document.body);
  return arvore;
}

function RascunhoInline({
  data,
  onSujo,
  onCancelar,
  onCriar,
}: {
  data: string;
  onSujo: (sujo: boolean) => void;
  onCancelar: () => void;
  onCriar: (campos: CamposPeca) => Promise<string | null>;
}) {
  const inicial = camposNovos(data);
  const [form, setForm] = useState(inicial);
  const [base, setBase] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  if (base.data !== data) {
    const proximo = camposNovos(data);
    setBase(proximo);
    setForm(proximo);
  }

  const sujo = !camposIguais(form, base);
  useEffect(() => {
    onSujo(sujo);
  }, [sujo, onSujo]);

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-gold/30 p-4"
      onSubmit={async (evento) => {
        evento.preventDefault();
        const falha = validarCamposPeca(form);
        if (falha) {
          setErro(falha);
          return;
        }
        setPendente(true);
        const resultado = await onCriar(form);
        setPendente(false);
        setErro(resultado);
      }}
    >
      <p className="text-sm uppercase tracking-[0.18em] text-gold">Rascunho</p>
      <p className="text-sm text-mist">Nada é gravado até você tocar em Salvar.</p>
      <CamposPecaForm idPrefix={`nova-${data}`} valor={form} onChange={setForm} />
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <BarraSalvar sujo={sujo || form.titulo.trim().length > 0} pendente={pendente} />
        <button type="button" className="botao" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PecaRapida({
  peca,
  preview,
  autorNome,
  onSujo,
  onGuardar,
  onConcluir,
  onPedirExclusao,
}: {
  peca: PecaLista;
  preview: boolean;
  autorNome: string;
  onSujo: (sujo: boolean) => void;
  onGuardar: (id: string, campos: CamposPeca) => Promise<string | null>;
  onConcluir: (id: string, valor: boolean) => Promise<string | null>;
  onPedirExclusao: () => void;
}) {
  const baseAtual = camposDePeca(peca);
  const [form, setForm] = useState(baseAtual);
  const [origem, setOrigem] = useState(baseAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const [notas, setNotas] = useState<Comentario[] | null>(preview ? comentariosExemplo(peca.id) : null);

  if (!camposIguais(baseAtual, origem)) {
    const editando = !camposIguais(form, origem);
    setOrigem(baseAtual);
    if (!editando) setForm(baseAtual);
  }

  const sujo = !camposIguais(form, origem);
  useEffect(() => {
    onSujo(sujo);
  }, [sujo, onSujo]);

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

  return (
    <div className="flex flex-col gap-4">
    <form
      className="flex flex-col gap-4"
      onSubmit={async (evento) => {
        evento.preventDefault();
        const falha = validarCamposPeca(form);
        if (falha) {
          setErro(falha);
          return;
        }
        setPendente(true);
        const resultado = await onGuardar(peca.id, form);
        setPendente(false);
        setErro(resultado);
        if (!resultado) {
          setOrigem(form);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-ink" style={{ background: COR_TIPO[peca.tipo] }}>
          {ROTULO_TIPO[peca.tipo]}
        </span>
        {peca.id.startsWith("local-") ? null : (
          <Link href={`/pecas/${peca.id}`} className="link text-sm">
            Abrir peça
          </Link>
        )}
      </div>
      <CamposPecaForm idPrefix={peca.id} valor={form} onChange={setForm} />
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <BarraSalvar sujo={sujo} pendente={pendente} />
    </form>
    <BotaoConcluir concluido={peca.concluido} onMudar={(valor) => onConcluir(peca.id, valor)} />
    {notas ? (
      <Notas pecaId={peca.id} iniciais={notas} preview={preview} autorNome={autorNome} />
    ) : (
      <div className="esqueleto h-16" aria-hidden="true" />
    )}
    <button type="button" className="min-h-11 self-start text-crimson" onClick={onPedirExclusao}>
      Limpar
    </button>
    </div>
  );
}
