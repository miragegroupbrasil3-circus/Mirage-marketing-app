"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugificar } from "@/lib/caminho";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Praca } from "@/lib/tipos";

type Rascunho = {
  cidade: string;
  temporada: string;
  inicio: string;
  fim: string;
  ativa: boolean;
};

const vazio: Rascunho = { cidade: "", temporada: "", inicio: "", fim: "", ativa: true };

export function PainelPracas({ iniciais, preview }: { iniciais: Praca[]; preview: boolean }) {
  const router = useRouter();
  const [pracas, setPracas] = useState(iniciais);
  const [erro, setErro] = useState<string | null>(null);

  async function criar(rascunho: Rascunho) {
    const mensagem = validar(rascunho);
    if (mensagem) {
      setErro(mensagem);
      return false;
    }
    const slug = slugificar(rascunho.cidade);
    if (preview) {
      setPracas((atual) => [
        ...atual,
        {
          id: `local-${crypto.randomUUID()}`,
          cidade: rascunho.cidade.trim(),
          slug,
          temporada: rascunho.temporada.trim() || null,
          inicio: rascunho.inicio || null,
          fim: rascunho.fim || null,
          ativa: rascunho.ativa,
          e_exemplo: false,
        },
      ]);
      setErro("Nesta prévia a praça fica só nesta tela.");
      return true;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pracas").insert({
      cidade: rascunho.cidade.trim(),
      slug,
      temporada: rascunho.temporada.trim() || null,
      inicio: rascunho.inicio || null,
      fim: rascunho.fim || null,
      ativa: rascunho.ativa,
    });
    if (error) {
      setErro(error.message.includes("pracas_slug") ? "Já existe uma praça com esse caminho." : "Não foi possível criar a praça.");
      return false;
    }
    setErro(null);
    router.refresh();
    return true;
  }

  async function salvar(praca: Praca, rascunho: Rascunho) {
    const mensagem = validar(rascunho);
    if (mensagem) {
      setErro(mensagem);
      return;
    }
    if (preview) {
      setPracas((atual) =>
        atual.map((item) =>
          item.id === praca.id
            ? {
                ...item,
                cidade: rascunho.cidade.trim(),
                temporada: rascunho.temporada.trim() || null,
                inicio: rascunho.inicio || null,
                fim: rascunho.fim || null,
                ativa: rascunho.ativa,
              }
            : item,
        ),
      );
      return;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase
      .from("pracas")
      .update({
        cidade: rascunho.cidade.trim(),
        temporada: rascunho.temporada.trim() || null,
        inicio: rascunho.inicio || null,
        fim: rascunho.fim || null,
        ativa: rascunho.ativa,
      })
      .eq("id", praca.id);
    if (error) setErro("Não foi possível guardar a praça.");
    else {
      setErro(null);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex max-w-[40rem] flex-col gap-16">
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <Formulario titulo="Nova praça" inicial={vazio} acao="Criar praça" onSalvar={criar} />
      <ul className="flex flex-col gap-14">
        {pracas.map((praca) => (
          <li key={praca.id} className="border-t border-line-soft pt-8">
            {praca.e_exemplo ? <p className="mb-4 text-gold">Esta praça é um exemplo. Não representa uma temporada.</p> : null}
            <p className="mb-4 text-sm text-mist">Caminho {praca.slug}</p>
            <Formulario
              titulo={praca.cidade}
              inicial={{
                cidade: praca.cidade,
                temporada: praca.temporada ?? "",
                inicio: praca.inicio ?? "",
                fim: praca.fim ?? "",
                ativa: praca.ativa,
              }}
              acao="Salvar praça"
              onSalvar={(rascunho) => salvar(praca, rascunho)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Formulario({
  titulo,
  inicial,
  acao,
  onSalvar,
}: {
  titulo: string;
  inicial: Rascunho;
  acao: string;
  onSalvar: (rascunho: Rascunho) => Promise<boolean | void>;
}) {
  const [rascunho, setRascunho] = useState(inicial);
  const [pendente, setPendente] = useState(false);

  function campo<K extends keyof Rascunho>(chave: K, valor: Rascunho[K]) {
    setRascunho((atual) => ({ ...atual, [chave]: valor }));
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (evento) => {
        evento.preventDefault();
        setPendente(true);
        const ok = await onSalvar(rascunho);
        if (ok && acao === "Criar praça") setRascunho(vazio);
        setPendente(false);
      }}
    >
      <h2 className="font-display text-3xl text-gold">{titulo}</h2>
      <Campo id={`${titulo}-cidade`} rotulo="Cidade" valor={rascunho.cidade} onChange={(valor) => campo("cidade", valor)} required />
      <Campo id={`${titulo}-temporada`} rotulo="Temporada" valor={rascunho.temporada} onChange={(valor) => campo("temporada", valor)} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Campo id={`${titulo}-inicio`} rotulo="Início" tipo="date" valor={rascunho.inicio} onChange={(valor) => campo("inicio", valor)} />
        <Campo id={`${titulo}-fim`} rotulo="Fim" tipo="date" valor={rascunho.fim} onChange={(valor) => campo("fim", valor)} />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-paper">
        <input type="checkbox" checked={rascunho.ativa} onChange={(evento) => campo("ativa", evento.target.checked)} />
        Ativa
      </label>
      <button type="submit" className="botao self-start" disabled={pendente}>
        {pendente ? "Salvando…" : acao}
      </button>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  onChange,
  tipo = "text",
  required = false,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-mist">
        {rotulo}
      </label>
      <input id={id} type={tipo} required={required} value={valor} onChange={(evento) => onChange(evento.target.value)} className="campo" />
    </div>
  );
}

function validar(rascunho: Rascunho) {
  if (!rascunho.cidade.trim()) return "Diga a cidade.";
  if (rascunho.inicio && rascunho.fim && rascunho.fim < rascunho.inicio) return "O fim precisa ser depois do início.";
  return null;
}
