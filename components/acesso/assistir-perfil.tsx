"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function AssistirPerfil({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;

    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`perfil-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "perfis", filter: `id=eq.${id}` }, () => {
        router.refresh();
      })
      .subscribe();

    const intervalo = window.setInterval(() => router.refresh(), 15000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      void supabase.removeChannel(canal);
    };
  }, [id, router]);

  return null;
}
