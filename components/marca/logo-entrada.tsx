"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function LogoEntrada({ children }: { children: ReactNode }) {
  const reduzir = useReducedMotion();

  return (
    <motion.div
      className="w-full"
      initial={reduzir ? false : { opacity: 0, scale: 0.92, y: 12, filter: "blur(10px) drop-shadow(0 0 0 rgba(245, 183, 0, 0))" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px) drop-shadow(0 0 22px rgba(245, 183, 0, 0.28))" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
