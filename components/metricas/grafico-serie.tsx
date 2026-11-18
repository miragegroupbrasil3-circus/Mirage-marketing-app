"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type PontoSerie = {
  nome: string;
  valor: number;
};

/**
 * Estrutura da Fase 4. Só desenha quando houver pontos reais.
 * A página de métricas não importa este arquivo enquanto não existir série.
 */
export function GraficoSerie({ pontos, rotulo }: { pontos: PontoSerie[]; rotulo: string }) {
  if (pontos.length === 0) return null;

  return (
    <figure className="max-w-[40rem]">
      <figcaption className="mb-4 text-paper">{rotulo}</figcaption>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pontos}>
            <XAxis dataKey="nome" stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} />
            <YAxis stroke="#C8C2B6" tick={{ fill: "#C8C2B6", fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={{ background: "#000", border: "1px solid rgba(231,200,122,0.4)", color: "#F6F3EC" }}
              labelStyle={{ color: "#E7C87A" }}
            />
            <Line type="monotone" dataKey="valor" name={rotulo} stroke="#E7C87A" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
