"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Confirmar({
  aberto,
  titulo,
  texto,
  confirmar,
  cancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: {
  aberto: boolean;
  titulo: string;
  texto: string;
  confirmar: string;
  cancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const [noCorpo, setNoCorpo] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setNoCorpo(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCancelar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  const arvore = (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/75" aria-label={cancelar} onClick={onCancelar} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-texto"
        className="cartao-circo relative z-10 w-full max-w-md rounded-3xl p-6"
      >
        <h2 id="confirmar-titulo" className="font-display text-3xl text-gold">
          {titulo}
        </h2>
        <p id="confirmar-texto" className="texto mt-3 text-paper">
          {texto}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="botao" onClick={onConfirmar} autoFocus>
            {confirmar}
          </button>
          <button type="button" className="botao" onClick={onCancelar}>
            {cancelar}
          </button>
        </div>
      </div>
    </div>
  );

  if (noCorpo && typeof document !== "undefined") return createPortal(arvore, document.body);
  return arvore;
}

export function AvisoDesfazer({ mensagem, onDesfazer }: { mensagem: string; onDesfazer: () => void }) {
  const [noCorpo, setNoCorpo] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setNoCorpo(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const arvore = (
    <div
      className="fixed inset-x-4 bottom-24 z-[70] mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-gold/40 bg-black/90 px-4 py-2 md:bottom-8"
      role="status"
    >
      <p className="text-paper">{mensagem}</p>
      <button type="button" className="botao px-3 text-sm" onClick={onDesfazer}>
        Desfazer
      </button>
    </div>
  );

  if (noCorpo && typeof document !== "undefined") return createPortal(arvore, document.body);
  return arvore;
}
