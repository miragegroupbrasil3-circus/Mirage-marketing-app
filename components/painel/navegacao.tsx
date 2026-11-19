"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

const ITENS = [
  { href: "/hoje", nome: "Hoje" },
  { href: "/grade", nome: "Grade" },
  { href: "/pracas", nome: "Praças" },
  { href: "/equipe", nome: "Equipe" },
];

export function Navegacao({ variante, pendentes }: { variante: "topo" | "base"; pendentes: number }) {
  const caminho = usePathname();
  const [contagem, setContagem] = useState(pendentes);
  const [origem, setOrigem] = useState(pendentes);
  if (pendentes !== origem) {
    setOrigem(pendentes);
    setContagem(pendentes);
  }

  useEffect(() => {
    const ouvir = (evento: Event) => {
      const valor = (evento as CustomEvent<number>).detail;
      if (typeof valor === "number") setContagem(valor);
    };
    window.addEventListener("mirage-pendentes", ouvir);
    return () => window.removeEventListener("mirage-pendentes", ouvir);
  }, []);

  return (
    <nav aria-label="Seções" className={variante === "topo" ? "hidden md:block" : "md:hidden"}>
      <ul className={variante === "topo" ? "flex items-center gap-6" : "flex items-stretch justify-around"}>
        {ITENS.map((item) => {
          const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
          const espera = item.href === "/equipe" && contagem > 0;
          return (
            <li key={item.href} className={variante === "base" ? "flex-1" : undefined}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                aria-label={espera ? `Equipe, ${contagem} aguardando` : undefined}
                className={cx(
                  "flex min-h-11 items-center justify-center gap-1 whitespace-nowrap px-1",
                  ativo ? "text-gold" : "text-paper",
                  variante === "topo" && ativo && "underline decoration-gold decoration-1 underline-offset-[0.4em]",
                )}
              >
                {item.nome}
                {espera ? (
                  <span className="text-gold" aria-hidden="true">
                    {contagem}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
