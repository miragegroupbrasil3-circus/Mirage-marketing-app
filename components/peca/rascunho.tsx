"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls, useReducedMotion } from "framer-motion";
import { BarraSalvar, CamposPecaForm } from "@/components/peca/campos";
import { Confirmar } from "@/components/ui/confirmar";
import { camposIguais, camposNovos, validarCamposPeca, type CamposPeca } from "@/lib/peca-campos";
import type { StatusPeca } from "@/lib/tipos";

export function RascunhoPeca({
  aberto,
  data,
  status,
  onFechar,
  onSalvar,
}: {
  aberto: boolean;
  data: string;
  status: StatusPeca;
  onFechar: () => void;
  onSalvar: (campos: CamposPeca) => Promise<string | null>;
}) {
  const reduzir = useReducedMotion();
  const controles = useDragControls();
  const [noCorpo, setNoCorpo] = useState(false);
  const inicial = camposNovos(data, status);
  const [form, setForm] = useState(inicial);
  const [base, setBase] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  if (aberto && (base.data !== data || base.status !== status)) {
    const proximo = camposNovos(data, status);
    setBase(proximo);
    setForm(proximo);
    setErro(null);
  }

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setNoCorpo(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const sujo = !camposIguais(form, base);

  function pedirFechar() {
    if (sujo) setConfirmar(true);
    else onFechar();
  }

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      if (!camposIguais(form, base)) setConfirmar(true);
      else onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, base, form, onFechar]);

  if (!aberto) return null;

  const arvore = (
    <div className="fixed inset-0 z-[60]">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fechar rascunho" onClick={pedirFechar} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rascunho-peca-titulo"
        drag={reduzir ? false : "y"}
        dragControls={controles}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.45 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 96) pedirFechar();
        }}
        className="cartao-circo absolute inset-x-0 bottom-0 z-10 max-h-[88dvh] overflow-y-auto rounded-t-3xl border-gold/40 p-5 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[32rem] md:rounded-none md:p-8"
      >
        <div
          className="mx-auto mb-4 h-1.5 w-14 cursor-grab rounded-full bg-gold/50 md:hidden"
          aria-hidden="true"
          onPointerDown={(evento) => controles.start(evento)}
        />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-magenta">Rascunho</p>
            <h2 id="rascunho-peca-titulo" className="font-display mt-1 text-3xl text-gold">
              Nova peça
            </h2>
            <p className="mt-2 text-sm text-mist">Nada é gravado até você tocar em Salvar.</p>
          </div>
          <button type="button" className="botao" onClick={pedirFechar}>
            Cancelar
          </button>
        </div>
        <form
          className="flex flex-col gap-5"
          onSubmit={async (evento) => {
            evento.preventDefault();
            const falha = validarCamposPeca(form);
            if (falha) {
              setErro(falha);
              return;
            }
            setPendente(true);
            const resultado = await onSalvar(form);
            setPendente(false);
            setErro(resultado);
            if (!resultado) onFechar();
          }}
        >
          <CamposPecaForm idPrefix="rascunho-grade" valor={form} onChange={setForm} />
          {erro ? (
            <p role="alert" className="text-gold">
              {erro}
            </p>
          ) : null}
          <BarraSalvar sujo={sujo} pendente={pendente} />
        </form>
      </motion.div>
      <Confirmar
        aberto={confirmar}
        titulo="Descartar rascunho?"
        texto="O que você digitou sai desta tela e não entra no calendário."
        confirmar="Descartar rascunho"
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => {
          setConfirmar(false);
          onFechar();
        }}
      />
    </div>
  );

  if (noCorpo && typeof document !== "undefined") return createPortal(arvore, document.body);
  return arvore;
}
