"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Entrada({ children }: { children: ReactNode }) {
  const reduzir = useReducedMotion();
  return (
    <motion.div
      initial={reduzir ? false : { y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
