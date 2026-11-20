"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugificar } from "@/lib/caminho";
import { hojeISO, rotuloDiaMes } from "@/lib/datas";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { fimAjustado, gravarTemporadaPrevia, resumoTemporada } from "@/lib/temporada";
import type { MarcoConteudo, Praca } from "@/lib/tipos";

type Rascunho = {
  cidade: string;
  temporada: string;
  inicio: string;
  fim: string;
  ativa: boolean;
};

type Marcos = { pecas: MarcoConteudo[]; demandas: MarcoConteudo[] };

const vazio: Rascunho = { cidade: "", temporada: "", inicio: "", fim: "", ativa: true };
const semMarcos: Marcos = { pecas: [], demandas: [] };

export function PainelPracas({
  iniciais,
  preview,
  marcos,
}: {
  iniciais: Praca[];
  preview: boolean;
  marcos: Record<string, Marcos>;
}) {
  const router = useRouter();
  const assinatura = iniciais.map((praca) => `${praca.id}:${praca.inicio}:${praca.fim}:${praca.cidade}:${praca.ativa}`).join("|");
  const [pracas, setPracas] = useState(iniciais);
  const [vista, setVista] = useState(assinatura);
  const [erro, setErro] = useState<string | null>(null);

  if (assinatura !== vista) {
    setVista(assinatura);
    setPracas(iniciais);
  }

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel("pracas-temporada")
      .on("postgres_changes", { event: "*", schema: "public", table: "pracas" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [preview, router]);

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
      return false;
    }
    const proxima = {
      cidade: rascunho.cidade.trim(),
      temporada: rascunho.temporada.trim() || null,
      inicio: rascunho.inicio || null,
      fim: rascunho.fim || null,
      ativa: rascunho.ativa,
    };
    if (preview) {
      gravarTemporadaPrevia(rascunho.inicio, rascunho.fim);
      setPracas((atual) => atual.map((item) => (item.id === praca.id ? { ...item, ...proxima } : item)));
      setErro(null);
      router.refresh();
      return true;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pracas").update(proxima).eq("id", praca.id);
    if (error) {
      setErro("Não foi possível guardar a praça.");
      return false;
    }
    setErro(null);
    router.refresh();
    return true;
  }

  return (
    <div className="mx-auto flex max-w-[40rem] flex-col gap-16">
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <Formulario titulo="Nova praça" inicial={vazio} acao="Criar praça" marcos={semMarcos} onSalvar={criar} />
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
              acao="Salvar"
              marcos={marcos[praca.id] ?? semMarcos}
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
  marcos,
  onSalvar,
}: {
  titulo: string;
  inicial: Rascunho;
  acao: string;
  marcos: Marcos;
  onSalvar: (rascunho: Rascunho) => Promise<boolean | void>;
}) {
  const [rascunho, setRascunho] = useState(inicial);
  const [base, setBase] = useState(inicial);
  const [pendente, setPendente] = useState(false);
  const sujo = !igual(rascunho, base);

  if (!igual(inicial, base) && igual(rascunho, base)) {
    setBase(inicial);
    setRascunho(inicial);
  }

  function campo<K extends keyof Rascunho>(chave: K, valor: Rascunho[K]) {
    setRascunho((atual) => ({ ...atual, [chave]: valor }));
  }

  const hoje = hojeISO();
  const periodo = resumoTemporada(rascunho.inicio, rascunho.fim, marcos.pecas, marcos.demandas);
  const erroDatas = rascunho.inicio && rascunho.fim && rascunho.fim < rascunho.inicio ? "O fim não pode ser antes do início." : null;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={async (evento) => {
        evento.preventDefault();
        setPendente(true);
        const ok = await onSalvar(rascunho);
        if (ok) setBase(acao === "Criar praça" ? vazio : rascunho);
        if (ok && acao === "Criar praça") setRascunho(vazio);
        setPendente(false);
      }}
    >
      <h2 className="font-display text-3xl text-gold">{titulo}</h2>
      <Campo id={`${titulo}-cidade`} rotulo="Cidade" valor={rascunho.cidade} onChange={(valor) => campo("cidade", valor)} required />
      <Campo id={`${titulo}-temporada`} rotulo="Temporada" valor={rascunho.temporada} onChange={(valor) => campo("temporada", valor)} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Campo id={`${titulo}-inicio`} rotulo="Início" tipo="date" valor={rascunho.inicio} onChange={(valor) => campo("inicio", valor)} />
        <div>
          <Campo id={`${titulo}-fim`} rotulo="Fim" tipo="date" valor={rascunho.fim} onChange={(valor) => campo("fim", valor)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="botao px-3 text-sm"
              onClick={() => campo("fim", fimAjustado(rascunho.fim, rascunho.inicio, -7, hoje))}
            >
              -7 dias
            </button>
            <button
              type="button"
              className="botao px-3 text-sm"
              onClick={() => campo("fim", fimAjustado(rascunho.fim, rascunho.inicio, 7, hoje))}
            >
              +7 dias
            </button>
          </div>
        </div>
      </div>
      {periodo.dias != null ? (
        <p className="text-paper">
          Esta temporada tem <span className="num text-gold">{periodo.dias}</span> {periodo.dias === 1 ? "dia" : "dias"}
          {rascunho.inicio && rascunho.fim ? `, de ${rotuloDiaMes(rascunho.inicio)} a ${rotuloDiaMes(rascunho.fim)}` : ""}.
        </p>
      ) : (
        <p className="text-sm text-mist">Informe início e fim para ver quantos dias a temporada tem.</p>
      )}
      {erroDatas ? (
        <p role="alert" className="text-gold">
          {erroDatas}
        </p>
      ) : null}
      {erroDatas ? null : <AvisoFora pecas={periodo.pecasFora} demandas={periodo.demandasFora} />}
      <label className="flex min-h-11 items-center gap-3 text-paper">
        <input type="checkbox" checked={rascunho.ativa} onChange={(evento) => campo("ativa", evento.target.checked)} />
        Ativa
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="botao self-start" disabled={pendente || !sujo}>
          {pendente ? "Salvando…" : acao}
        </button>
        {sujo ? <p className="text-sm text-gold">Alterações não salvas</p> : null}
      </div>
    </form>
  );
}

function AvisoFora({ pecas, demandas }: { pecas: MarcoConteudo[]; demandas: MarcoConteudo[] }) {
  if (pecas.length === 0 && demandas.length === 0) return null;
  const nomes = [...pecas.map((item) => item.titulo), ...demandas.map((item) => item.titulo)].slice(0, 4);
  const pecasTexto = pecas.length === 1 ? "1 peça" : `${pecas.length} peças`;
  const demandasTexto = demandas.length === 1 ? "1 demanda" : `${demandas.length} demandas`;
  const contagem = [pecas.length ? pecasTexto : "", demandas.length ? demandasTexto : ""].filter(Boolean).join(" e ");
  return (
    <p role="status" className="rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-paper">
      Fora do novo período: {contagem}. Dá para salvar mesmo assim — nada é apagado.
      {nomes.length > 0 ? <span className="mt-1 block text-gold">{nomes.join(" · ")}</span> : null}
    </p>
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

function igual(a: Rascunho, b: Rascunho) {
  return a.cidade === b.cidade && a.temporada === b.temporada && a.inicio === b.inicio && a.fim === b.fim && a.ativa === b.ativa;
}

function validar(rascunho: Rascunho) {
  if (!rascunho.cidade.trim()) return "Diga a cidade.";
  if (rascunho.inicio && rascunho.fim && rascunho.fim < rascunho.inicio) return "O fim não pode ser antes do início.";
  return null;
}
