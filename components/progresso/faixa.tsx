"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Contador } from "@/components/motion/contador";

export function FaixaProgresso({
  feitas,
  total,
  rotulo,
  vazio,
}: {
  feitas: number;
  total: number;
  rotulo: string;
  vazio?: string;
}) {
  const reduzir = useReducedMotion();
  if (total === 0) {
    return <p className="text-sm text-mist">{vazio ?? `${rotulo}: nenhuma peça neste período.`}</p>;
  }
  const pct = (feitas / total) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-paper">{rotulo}</span>
        <span className="text-gold">
          <Contador valor={feitas} /> de {total}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={feitas}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={rotulo}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold via-amber to-magenta"
          initial={reduzir ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
      </div>
    </div>
  );
}
