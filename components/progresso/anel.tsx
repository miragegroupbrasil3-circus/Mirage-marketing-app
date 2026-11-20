"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { Contador } from "@/components/motion/contador";

export function AnelProgresso({ feitas, total, rotulo }: { feitas: number; total: number; rotulo: string }) {
  const reduzir = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const raio = 36;
  const volta = 2 * Math.PI * raio;
  const fracao = total === 0 ? 0 : feitas / total;

  return (
    <div className="flex items-center gap-4">
      <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label={total === 0 ? `${rotulo}: sem peças` : `${rotulo}: ${feitas} de ${total}`}>
        <circle cx="46" cy="46" r={raio} stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="46"
          cy="46"
          r={raio}
          stroke={`url(#${id})`}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={volta}
          initial={reduzir ? false : { strokeDashoffset: volta }}
          animate={{ strokeDashoffset: volta * (1 - fracao) }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          transform="rotate(-90 46 46)"
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5B700" />
            <stop offset="55%" stopColor="#FF2D8A" />
            <stop offset="100%" stopColor="#00E5D0" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p className="text-sm text-mist">{rotulo}</p>
        {total === 0 ? (
          <p className="mt-1 max-w-[12rem] text-paper">Sem peças neste recorte.</p>
        ) : (
          <p className="font-display mt-1 text-3xl text-gold">
            <Contador valor={feitas} />
            <span className="text-paper">/{total}</span>
          </p>
        )}
      </div>
    </div>
  );
}
