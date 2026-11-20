"use client";

import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import { Inclinavel } from "@/components/motion/inclinavel";
import { COR_GRAFICO } from "@/lib/progresso";

type Semana = { nome: string; periodo: string; planejadas: number; concluidas: number };
type Formato = { nome: string; tipo: string; planejadas: number; concluidas: number };
type Estado = { nome: string; status: string; total: number };
type Pessoa = { id: string; nome: string; total: number };

const estilo = {
  background: "#050308",
  border: "1px solid rgba(245,183,0,0.45)",
  borderRadius: 12,
  color: "#F6F3EC",
};

export function Graficos({
  semanas,
  formatos,
  estados,
  pessoas,
}: {
  semanas: Semana[];
  formatos: Formato[];
  estados: Estado[];
  pessoas: Pessoa[];
}) {
  const reduzir = useReducedMotion();
  const animar = !reduzir;
  const vazio = semanas.length === 0;

  if (vazio) {
    return (
      <p className="texto cartao-circo mt-8 rounded-3xl p-6 text-paper">
        Ainda não há peças nesta praça para medir o progresso.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <Cartao titulo="Por semana" detalhe="Peças planejadas e concluídas em cada semana que tem conteúdo.">
          <BarChart data={semanas} width={480} height={220}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="nome" stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} width={32} />
            <Tooltip contentStyle={estilo} labelFormatter={(_, payload) => String(payload?.[0]?.payload?.periodo ?? "")} />
            <Bar dataKey="planejadas" name="Planejadas" fill={COR_GRAFICO.planejadas} radius={6} isAnimationActive={animar} />
            <Bar dataKey="concluidas" name="Concluídas" fill={COR_GRAFICO.concluidas} radius={6} isAnimationActive={animar} />
          </BarChart>
      </Cartao>

      <Cartao titulo="Por formato" detalhe="A cor é a do formato. A barra de ouro é o que já foi concluído.">
          <BarChart data={formatos} width={480} height={220}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="nome" stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} width={32} />
            <Tooltip contentStyle={estilo} />
            <Bar dataKey="planejadas" name="Planejadas" fill="#FF2D8A" radius={6} isAnimationActive={animar} />
            <Bar dataKey="concluidas" name="Concluídas" fill="#F5B700" radius={6} isAnimationActive={animar} />
          </BarChart>
      </Cartao>

      <Cartao titulo="Por estado" detalhe="Quantas peças estão em cada estado de produção.">
          <BarChart data={estados} width={480} height={220}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="nome" stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} width={32} />
            <Tooltip contentStyle={estilo} />
            <Bar dataKey="total" name="Peças" fill="#00E5D0" radius={6} isAnimationActive={animar} />
          </BarChart>
      </Cartao>

      <Cartao titulo="Por pessoa" detalhe="Peças concluídas, contadas por quem marcou Concluir.">
        {pessoas.length === 0 ? (
          <p className="texto text-paper">Ninguém concluiu uma peça ainda.</p>
        ) : (
            <BarChart data={pessoas} layout="vertical" margin={{ left: 16 }} width={480} height={220}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} />
              <YAxis type="category" dataKey="nome" stroke="#C8C2B6" tick={{ fill: "#F6F3EC", fontSize: 12 }} width={88} />
              <Tooltip contentStyle={estilo} />
              <Bar dataKey="total" name="Concluídas" fill="#7B2CFF" radius={6} isAnimationActive={animar} />
            </BarChart>
        )}
      </Cartao>
    </div>
  );
}

function Cartao({ titulo, detalhe, children }: { titulo: string; detalhe: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(480);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 480;
      setLargura(Math.max(260, Math.floor(w)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const grafico =
    isValidElement(children) && typeof children.type !== "string"
      ? cloneElement(children as React.ReactElement<{ width?: number; height?: number }>, { width: largura, height: 220 })
      : children;

  return (
    <Inclinavel className="cartao-circo rounded-3xl p-4">
      <h2 className="font-display text-2xl text-gold">{titulo}</h2>
      <p className="mt-1 mb-4 text-sm text-mist">{detalhe}</p>
      <div ref={ref} className="h-60 w-full min-w-0 overflow-hidden">
        {grafico}
      </div>
    </Inclinavel>
  );
}
