"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

export function Contador({ valor }: { valor: number }) {
  const reduzir = useReducedMotion();
  const [mostra, setMostra] = useState(valor);
  const anterior = useRef(valor);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = valor;
    if (reduzir || de === valor) return;
    const controle = animate(de, valor, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (atual) => setMostra(Math.round(atual)),
    });
    return () => controle.stop();
  }, [reduzir, valor]);

  return <span className="num">{reduzir ? valor : mostra}</span>;
}
