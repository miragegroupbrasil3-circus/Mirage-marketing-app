"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

const ITENS = [
  { href: "/hoje", nome: "Hoje" },
  { href: "/grade", nome: "Grade" },
  { href: "/pracas", nome: "Praças" },
];

export function Navegacao({ variante }: { variante: "topo" | "base" }) {
  const caminho = usePathname();

  return (
    <nav aria-label="Seções" className={variante === "topo" ? "hidden md:block" : "md:hidden"}>
      <ul className={variante === "topo" ? "flex items-center gap-6" : "flex items-stretch justify-around"}>
        {ITENS.map((item) => {
          const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className={variante === "base" ? "flex-1" : undefined}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center justify-center px-1",
                  ativo ? "text-gold" : "text-paper",
                  variante === "topo" && ativo && "underline decoration-gold decoration-1 underline-offset-[0.4em]",
                )}
              >
                {item.nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
