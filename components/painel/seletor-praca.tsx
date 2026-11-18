"use client";

import { useTransition } from "react";
import { escolherPraca } from "@/lib/acoes";
import type { Praca } from "@/lib/tipos";

export function SeletorPraca({ pracas, atual }: { pracas: Praca[]; atual: string | null }) {
  const [pendente, iniciar] = useTransition();

  if (pracas.length === 0) {
    return (
      <a href="/pracas" className="link text-sm">
        Criar praça
      </a>
    );
  }

  return (
    <div className={pendente ? "opacity-70" : undefined}>
      <label htmlFor="praca" className="sr-only">
        Praça
      </label>
      <select
        id="praca"
        className="campo min-h-11 max-w-[14rem] cursor-pointer border-0 bg-transparent py-0 text-paper"
        value={atual ?? pracas[0]?.id}
        onChange={(evento) => iniciar(() => escolherPraca(evento.target.value))}
      >
        {pracas.map((praca) => (
          <option key={praca.id} value={praca.id}>
            {praca.cidade}
          </option>
        ))}
      </select>
    </div>
  );
}
