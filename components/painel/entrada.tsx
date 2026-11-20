"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function Entrada({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  return (
    <div key={caminho} className="entrada">
      {children}
    </div>
  );
}
