"use client";

import { useEffect, useRef } from "react";

type Particula = {
  x: number;
  y: number;
  r: number;
  v: number;
  fase: number;
  cor: string;
};

const CORES = ["#F5B700", "#FFE7A3", "#FF2D8A", "#00E5D0", "#FFFFFF"];

function fraco() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const memoria = nav.deviceMemory ?? 8;
  const nucleos = navigator.hardwareConcurrency ?? 8;
  return memoria <= 4 || nucleos <= 4 || Boolean(nav.connection?.saveData);
}

export default function Glitter() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const contexto = canvas.getContext("2d", { alpha: true });
    if (!contexto) return;

    const leve = fraco();
    const quantidade = leve ? 26 : 58;
    const limite = leve ? 1 : 1.5;
    let largura = 0;
    let altura = 0;
    let particulas: Particula[] = [];
    let quadro = 0;
    let ativo = !document.hidden;

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, limite);
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas!.width = Math.max(1, Math.floor(largura * dpr));
      canvas!.height = Math.max(1, Math.floor(altura * dpr));
      contexto!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function semear() {
      particulas = Array.from({ length: quantidade }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        r: Math.random() * (leve ? 1.4 : 1.8) + 0.4,
        v: Math.random() * 0.22 + 0.05,
        fase: Math.random() * Math.PI * 2,
        cor: CORES[Math.floor(Math.random() * CORES.length)] ?? "#F5B700",
      }));
    }

    function desenhar(tempo: number) {
      contexto!.clearRect(0, 0, largura, altura);
      for (const ponto of particulas) {
        ponto.y -= ponto.v;
        ponto.x += Math.sin(tempo / 1400 + ponto.fase) * 0.12;
        if (ponto.y < -4) {
          ponto.y = altura + 4;
          ponto.x = Math.random() * largura;
        }
        const alfa = 0.25 + (Math.sin(tempo / 500 + ponto.fase) + 1) * 0.22;
        contexto!.globalAlpha = alfa;
        contexto!.fillStyle = ponto.cor;
        contexto!.beginPath();
        contexto!.arc(ponto.x, ponto.y, ponto.r, 0, Math.PI * 2);
        contexto!.fill();
      }
      contexto!.globalAlpha = 1;
    }

    function loop(tempo: number) {
      quadro = window.requestAnimationFrame(loop);
      if (!ativo) return;
      desenhar(tempo);
    }

    function visibilidade() {
      ativo = !document.hidden;
    }

    function redimensionar() {
      medir();
      semear();
    }

    medir();
    semear();
    quadro = window.requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", visibilidade);
    window.addEventListener("resize", redimensionar);

    return () => {
      window.cancelAnimationFrame(quadro);
      document.removeEventListener("visibilitychange", visibilidade);
      window.removeEventListener("resize", redimensionar);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true" />;
}
