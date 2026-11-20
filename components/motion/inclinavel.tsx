"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { cx } from "@/lib/cx";

export function Inclinavel({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduzir = useReducedMotion();
  const [fino, setFino] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const aplicar = () => setFino(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);

  return (
    <div
      ref={ref}
      className={cx("transition-transform duration-200", className)}
      style={{ transformStyle: "preserve-3d" }}
      onPointerMove={(evento) => {
        if (!fino || reduzir || !ref.current) return;
        const caixa = ref.current.getBoundingClientRect();
        const x = (evento.clientX - caixa.left) / caixa.width - 0.5;
        const y = (evento.clientY - caixa.top) / caixa.height - 0.5;
        ref.current.style.transform = `perspective(800px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}
