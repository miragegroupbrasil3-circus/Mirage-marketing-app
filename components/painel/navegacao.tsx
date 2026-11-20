"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { cx } from "@/lib/cx";

const ITENS = [
  { href: "/calendario", nome: "Calendário" },
  { href: "/grade", nome: "Grade" },
  { href: "/pracas", nome: "Praças" },
  { href: "/metricas", nome: "Métricas" },
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
      <LayoutGroup id={`nav-${variante}`}>
        <ul className={variante === "topo" ? "flex items-center gap-2" : "flex items-stretch justify-around"}>
          {ITENS.map((item) => {
            const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
            const espera = item.href === "/equipe" && contagem > 0;
            return (
              <li key={item.href} className={variante === "base" ? "relative flex-1" : "relative"}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  aria-label={espera ? `Equipe, ${contagem} aguardando` : undefined}
                  className={cx(
                    "relative flex min-h-11 items-center justify-center gap-1 px-2 text-center text-[0.7rem] leading-tight sm:text-sm",
                    ativo ? "text-gold" : "text-paper",
                  )}
                >
                  {ativo ? (
                    <motion.span
                      layoutId={`indicador-${variante}`}
                      className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-magenta via-gold to-turquoise"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
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
      </LayoutGroup>
    </nav>
  );
}
