"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function LogoEntrada({ children }: { children: ReactNode }) {
  const reduzir = useReducedMotion();

  return (
    <motion.div
      className="w-full"
      initial={reduzir ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
