"use client";

import { useState } from "react";
import { Celebracao } from "@/components/peca/celebracao";
import { cx } from "@/lib/cx";

export function BotaoConcluir({
  concluido,
  onMudar,
}: {
  concluido: boolean;
  onMudar: (valor: boolean) => Promise<string | null>;
}) {
  const [pulso, setPulso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function alternar() {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    const proximo = !concluido;
    const falha = await onMudar(proximo);
    setOcupado(false);
    if (falha) {
      setErro(falha);
      return;
    }
    if (proximo) setPulso((atual) => atual + 1);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void alternar()}
        aria-pressed={concluido}
        disabled={ocupado}
        className={cx(
          "flex min-h-14 w-full items-center justify-center rounded-full px-6 text-lg font-semibold active:scale-[0.98]",
          concluido
            ? "border border-gold bg-gold/15 text-gold"
            : "bg-gradient-to-r from-gold via-amber to-magenta text-ink",
        )}
      >
        {concluido ? "Desmarcar concluído" : "Concluir"}
      </button>
      <p className="sr-only" aria-live="polite">
        {pulso > 0 && concluido ? "Peça concluída." : ""}
      </p>
      {erro ? (
        <p role="alert" className="mt-2 text-gold">
          {erro}
        </p>
      ) : null}
      <Celebracao pulso={pulso} />
    </div>
  );
}
