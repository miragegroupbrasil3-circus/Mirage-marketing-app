"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function OuvirPraca({ pracaId, preview }: { pracaId: string; preview: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`praca-progresso:${pracaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pracas", filter: `id=eq.${pracaId}` }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pecas", filter: `praca_id=eq.${pracaId}` }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [pracaId, preview, router]);

  return null;
}
