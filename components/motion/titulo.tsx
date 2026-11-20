"use client";

import { motion, useReducedMotion } from "framer-motion";

export function Titulo({ children, className = "" }: { children: string; className?: string }) {
  const reduzir = useReducedMotion();
  const letras = Array.from(children);

  return (
    <h1 className={`font-display brilho text-5xl sm:text-6xl ${className}`}>
      {reduzir
        ? children
        : letras.map((letra, indice) => (
            <motion.span
              key={`${letra}-${indice}`}
              className="inline-block"
              initial={{ y: "0.4em" }}
              animate={{ y: 0 }}
              transition={{ delay: Math.min(indice, 18) * 0.028, type: "spring", stiffness: 340, damping: 26 }}
            >
              {letra === " " ? "\u00A0" : letra}
            </motion.span>
          ))}
    </h1>
  );
}
