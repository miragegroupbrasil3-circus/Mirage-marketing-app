"use client";

import { useEffect, useRef } from "react";

const CORES = ["#F5B700", "#FF2D8A", "#00E5D0", "#7B2CFF", "#FFFFFF", "#FF9F1C"];

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  cor: string;
  vida: number;
};

export function Celebracao({ pulso }: { pulso: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pulso === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    canvas.width = Math.floor(largura * dpr);
    canvas.height = Math.floor(altura * dpr);
    contexto.setTransform(dpr, 0, 0, dpr, 0, 0);

    const origemX = largura / 2;
    const origemY = altura * 0.42;
    const pecas: Particula[] = Array.from({ length: 72 }, () => {
      const angulo = Math.random() * Math.PI * 2;
      const forca = 3 + Math.random() * 7;
      return {
        x: origemX,
        y: origemY,
        vx: Math.cos(angulo) * forca,
        vy: Math.sin(angulo) * forca - 2,
        r: 1.5 + Math.random() * 2.4,
        cor: CORES[Math.floor(Math.random() * CORES.length)] ?? "#F5B700",
        vida: 1,
      };
    });

    let quadro = 0;
    const inicio = performance.now();
    const desenhar = (agora: number) => {
      const decorrido = agora - inicio;
      contexto.clearRect(0, 0, largura, altura);
      let vivas = false;
      for (const ponto of pecas) {
        ponto.vy += 0.12;
        ponto.x += ponto.vx;
        ponto.y += ponto.vy;
        ponto.vida = Math.max(0, 1 - decorrido / 1400);
        if (ponto.vida <= 0) continue;
        vivas = true;
        contexto.globalAlpha = ponto.vida;
        contexto.fillStyle = ponto.cor;
        contexto.fillRect(ponto.x, ponto.y, ponto.r * 2, ponto.r * 0.7);
      }
      contexto.globalAlpha = 1;
      if (vivas && decorrido < 1500) quadro = window.requestAnimationFrame(desenhar);
      else contexto.clearRect(0, 0, largura, altura);
    };
    quadro = window.requestAnimationFrame(desenhar);
    return () => window.cancelAnimationFrame(quadro);
  }, [pulso]);

  if (pulso === 0) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true" />;
}
