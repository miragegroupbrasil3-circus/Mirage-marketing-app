import { Logo } from "@/components/marca/logo";
import { ToqueDourado } from "@/components/login/toque-dourado";
import type { ReactNode } from "react";

export function MolduraAcesso({ children }: { children: ReactNode }) {
  return (
    <main id="conteudo" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16">
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10">
        <div className="relative flex w-full items-center justify-center py-8">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <ellipse cx="100" cy="100" rx="96" ry="96" fill="none" stroke="#E7C87A" strokeWidth="0.75" />
            </svg>
            <ToqueDourado />
          </div>
          <h1 className="relative">
            <Logo className="text-7xl sm:text-8xl" />
          </h1>
        </div>
        {children}
      </div>
    </main>
  );
}
