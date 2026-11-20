"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { tempoRelativo } from "@/lib/datas";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Comentario } from "@/lib/tipos";

function Inicial({ nome }: { nome: string }) {
  const letra = nome.trim().charAt(0).toUpperCase() || "E";
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-magenta to-royal text-sm font-semibold text-white"
    >
      {letra}
    </span>
  );
}

export function Notas({
  pecaId,
  iniciais,
  preview,
  autorNome,
  onContagem,
}: {
  pecaId: string;
  iniciais: Comentario[];
  preview: boolean;
  autorNome: string;
  onContagem?: (total: number) => void;
}) {
  const router = useRouter();
  const [notas, setNotas] = useState(iniciais);
  const [assinatura, setAssinatura] = useState(iniciais.map((nota) => nota.id).join("|"));
  const proxima = iniciais.map((nota) => nota.id).join("|");
  if (proxima !== assinatura) {
    setAssinatura(proxima);
    setNotas(iniciais);
  }
  const [erro, setErro] = useState<string | null>(null);
  const [, setRelogio] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setRelogio((atual) => atual + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`notas:${pecaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comentarios", filter: `peca_id=eq.${pecaId}` }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [pecaId, preview, router]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const texto = String(dados.get("texto") ?? "").trim();
    if (!texto) return;
    setErro(null);
    const nota: Comentario = {
      id: `local-${crypto.randomUUID()}`,
      peca_id: pecaId,
      autor_id: null,
      texto,
      criado_em: new Date().toISOString(),
      autor_nome: autorNome || "Equipe",
    };
    if (preview) {
      const lista = [...notas, nota];
      setNotas(lista);
      onContagem?.(lista.length);
      evento.currentTarget.reset();
      return;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("comentarios").insert({ peca_id: pecaId, texto });
    if (error) {
      setErro("Não foi possível guardar a observação.");
      return;
    }
    const lista = [...notas, nota];
    setNotas(lista);
    onContagem?.(lista.length);
    evento.currentTarget.reset();
    router.refresh();
  }

  return (
    <section>
      <h3 className="font-display text-2xl text-gold">
        Observações
        {notas.length > 0 ? <span className="num ml-2 text-base text-magenta">{notas.length}</span> : null}
      </h3>
      {notas.length === 0 ? (
        <p className="texto mt-3 text-mist">Nenhuma observação ainda. A conversa desta peça aparece aqui.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {notas.map((nota) => (
            <li key={nota.id} className="flex gap-3">
              <Inicial nome={nota.autor_nome} />
              <div className="min-w-0 border-l border-magenta/50 pl-3">
                <p className="text-sm text-gold">
                  {nota.autor_nome} <span className="text-mist">{tempoRelativo(nota.criado_em)}</span>
                </p>
                <p className="texto text-paper">{nota.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={enviar} className="mt-4 flex flex-col gap-3">
        <label htmlFor={`nota-${pecaId}`} className="text-paper">
          Nova observação
        </label>
        <textarea id={`nota-${pecaId}`} name="texto" required maxLength={4000} className="campo" placeholder="Uma nota para a equipe" />
        <button type="submit" className="botao self-start">
          Publicar
        </button>
      </form>
      {erro ? (
        <p role="alert" className="mt-2 text-gold">
          {erro}
        </p>
      ) : null}
    </section>
  );
}
