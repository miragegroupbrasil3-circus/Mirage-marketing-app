import { Logo } from "@/components/marca/logo";
import { LogoEntrada } from "@/components/marca/logo-entrada";
import type { ReactNode } from "react";

export function MolduraAcesso({ children, animar = false }: { children: ReactNode; animar?: boolean }) {
  const marca = <Logo tamanho="acesso" preload />;

  return (
    <main id="conteudo" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16">
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10">
        <h1 className="w-full">{animar ? <LogoEntrada>{marca}</LogoEntrada> : marca}</h1>
        {children}
      </div>
    </main>
  );
}
