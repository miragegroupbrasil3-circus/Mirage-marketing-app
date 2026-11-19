"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function EquipeAoVivo() {
  const router = useRouter();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;

    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel("perfis-equipe")
      .on("postgres_changes", { event: "*", schema: "public", table: "perfis" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [router]);

  return null;
}
