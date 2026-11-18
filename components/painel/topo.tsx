import Link from "next/link";
import { sair } from "@/lib/acoes";
import { Logo } from "@/components/marca/logo";
import { Navegacao } from "@/components/painel/navegacao";
import { SeletorPraca } from "@/components/painel/seletor-praca";
import type { Praca } from "@/lib/tipos";

export function Topo({ pracas, pracaId, nome }: { pracas: Praca[]; pracaId: string | null; nome: string }) {
  return (
    <header className="border-b border-line-soft">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-5 py-4 md:px-10">
        <Link href="/hoje" className="shrink-0 text-gold">
          <Logo className="text-[1.7rem]" />
        </Link>
        <Navegacao variante="topo" />
        <div className="ml-auto flex items-center gap-4">
          <SeletorPraca pracas={pracas} atual={pracaId} />
          <span className="hidden text-mist lg:inline">{nome}</span>
          <form action={sair}>
            <button type="submit" className="min-h-11 px-2 text-paper">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
