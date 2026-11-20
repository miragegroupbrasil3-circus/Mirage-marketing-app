"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type DragEvent } from "react";
import { Moldura } from "@/components/marca/moldura";
import { BotaoConcluir } from "@/components/peca/concluir";
import { Notas } from "@/components/peca/notas";
import { caminhoMidia } from "@/lib/caminho";
import { quando } from "@/lib/datas";
import { enviarParaStorage, medidasDoArquivo, tokenDeEnvio } from "@/lib/envio";
import { ROTULO_CAMPO, ROTULO_PILAR, ROTULO_STATUS, ROTULO_TIPO, textoHistorico } from "@/lib/rotulos";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { LIMITE_ARQUIVO, mensagemArquivoGrande, PILARES, STATUS_PECA, TIPOS_PECA, type Comentario, type ItemHistorico, type Midia, type Peca, type Pilar, type StatusPeca, type TipoPeca } from "@/lib/tipos";

const ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];

export function EditorPeca({
  peca,
  midias,
  comentarios,
  historico,
  preview,
  pracaSlug,
  autorNome,
}: {
  peca: Peca;
  midias: Midia[];
  comentarios: Comentario[];
  historico: ItemHistorico[];
  preview: boolean;
  pracaSlug: string;
  autorNome: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<{ nome: string; porcentagem: number } | null>(null);
  const [sobre, setSobre] = useState(false);
  const [locais, setLocais] = useState<Midia[]>(midias);
  const [ajuste, setAjuste] = useState<Partial<Peca>>({});
  const [trilha, setTrilha] = useState(historico);
  const vista = { ...peca, ...ajuste };

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`peca:${peca.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pecas", filter: `id=eq.${peca.id}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "midias", filter: `peca_id=eq.${peca.id}` }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [peca.id, preview, router]);

  async function salvar(campo: string, valor: string | boolean | null) {
    setErro(null);
    if (preview) {
      setAjuste((atual) => {
        const proximo = { ...atual, [campo]: valor } as Partial<Peca>;
        if (campo === "concluido") {
          const feito = Boolean(valor);
          proximo.concluido = feito;
          proximo.concluido_por = feito ? peca.criado_por : null;
          proximo.concluido_em = feito ? new Date().toISOString() : null;
        }
        return proximo;
      });
      setTrilha((atual) => [
        {
          id: `local-${crypto.randomUUID()}`,
          peca_id: peca.id,
          autor_id: null,
          campo,
          antes: (peca as unknown as Record<string, unknown>)[campo] ?? null,
          depois: valor,
          criado_em: new Date().toISOString(),
          autor_nome: autorNome,
        },
        ...atual,
      ]);
      return null;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pecas").update({ [campo]: valor }).eq("id", peca.id);
    if (error) return "Não foi possível guardar.";
    router.refresh();
    return null;
  }

  async function enviarArquivos(lista: File[]) {
    for (const arquivo of lista) {
      if (arquivo.size > LIMITE_ARQUIVO) {
        setErro(mensagemArquivoGrande(arquivo.name));
        continue;
      }
      if (!ACEITOS.includes(arquivo.type)) {
        setErro("Envie uma imagem (JPG, PNG, WebP ou GIF) ou um vídeo (MP4, MOV ou WebM).");
        continue;
      }
      const tipo = arquivo.type.startsWith("video/") ? "video" : "imagem";
      const versao = (preview ? locais.length : midias.length) + 1;
      const caminho = caminhoMidia({
        pracaSlug,
        data: vista.data,
        pecaSlug: vista.slug,
        versao,
        arquivo: arquivo.name,
      });

      if (preview) {
        setEnviando({ nome: arquivo.name, porcentagem: 40 });
        const medidas = await medidasDoArquivo(arquivo);
        setEnviando({ nome: arquivo.name, porcentagem: 100 });
        setLocais((atual) => [
          ...atual,
          {
            id: `local-${crypto.randomUUID()}`,
            peca_id: peca.id,
            storage_path: caminho,
            tipo,
            versao,
            e_final: atual.every((item) => !item.e_final),
            largura: medidas.largura,
            altura: medidas.altura,
            duracao_segundos: medidas.duracao,
            nome_arquivo: arquivo.name,
            mime: arquivo.type,
            bytes: arquivo.size,
            criado_em: new Date().toISOString(),
            url: URL.createObjectURL(arquivo),
          },
        ]);
        setEnviando(null);
        continue;
      }

      const token = await tokenDeEnvio();
      if (!token) {
        setErro("Entre de novo para enviar o arquivo.");
        return;
      }
      setEnviando({ nome: arquivo.name, porcentagem: 0 });
      try {
        await enviarParaStorage(caminho, arquivo, token, (porcentagem) => setEnviando({ nome: arquivo.name, porcentagem }));
        const medidas = await medidasDoArquivo(arquivo);
        const supabase = criarClienteNavegador();
        const { error } = await supabase.from("midias").insert({
          peca_id: peca.id,
          storage_path: caminho,
          tipo,
          versao,
          e_final: midias.every((item) => !item.e_final),
          largura: medidas.largura,
          altura: medidas.altura,
          duracao_segundos: medidas.duracao,
          nome_arquivo: arquivo.name,
          mime: arquivo.type,
          bytes: arquivo.size,
        });
        if (error) {
          setErro("O arquivo subiu, mas não entrou na peça.");
        } else {
          router.refresh();
        }
      } catch (falha) {
        setErro(falha instanceof Error && falha.message === "grande" ? mensagemArquivoGrande(arquivo.name) : "Não foi possível enviar o arquivo.");
      } finally {
        setEnviando(null);
      }
    }
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setSobre(false);
    void enviarArquivos([...evento.dataTransfer.files]);
  }

  async function marcarFinal(id: string) {
    if (preview) {
      setLocais((atual) => atual.map((item) => ({ ...item, e_final: item.id === id })));
      return;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("midias").update({ e_final: true }).eq("id", id);
    if (error) setErro("Não foi possível marcar a mídia final.");
    else router.refresh();
  }

  async function remover(midia: Midia) {
    if (preview) {
      setLocais((atual) => atual.filter((item) => item.id !== midia.id));
      return;
    }
    const supabase = criarClienteNavegador();
    await supabase.storage.from("midias").remove([midia.storage_path]);
    const { error } = await supabase.from("midias").delete().eq("id", midia.id);
    if (error) setErro("Não foi possível remover a mídia.");
    else router.refresh();
  }

  const listaMidias = preview ? locais : midias;
  const listaHistorico = preview ? trilha : historico;

  return (
    <article className="mx-auto flex max-w-[40rem] flex-col gap-12">
      <p>
        <Link href="/calendario" className="link">
          Calendário
        </Link>
      </p>
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}

      <CampoTexto rotulo="Título" valor={vista.titulo} destaque onSalvar={(valor) => salvar("titulo", valor)} />

      <div className="grid gap-8 sm:grid-cols-2">
        <CampoSelecao
          rotulo="Estado"
          valor={vista.status}
          opcoes={STATUS_PECA.map((valor) => ({ valor, nome: ROTULO_STATUS[valor] }))}
          onSalvar={(valor) => salvar("status", valor as StatusPeca)}
        />
        <CampoTexto
          rotulo="Horário"
          valor={vista.horario?.slice(0, 5) ?? ""}
          onSalvar={(valor) => {
            const horario = normalizarHorario(valor);
            if (valor.trim() && !horario) return Promise.resolve("Use o formato 18:00.");
            return salvar("horario", horario);
          }}
        />
        <CampoTexto rotulo="Data" valor={vista.data} tipo="date" onSalvar={(valor) => salvar("data", valor)} />
        <CampoSelecao
          rotulo="Formato"
          valor={vista.tipo}
          opcoes={TIPOS_PECA.map((valor) => ({ valor, nome: ROTULO_TIPO[valor] }))}
          onSalvar={(valor) => salvar("tipo", valor as TipoPeca)}
        />
        <CampoSelecao
          rotulo="Pilar"
          valor={vista.pilar}
          opcoes={PILARES.map((valor) => ({ valor, nome: ROTULO_PILAR[valor] }))}
          onSalvar={(valor) => salvar("pilar", valor as Pilar)}
        />
      </div>

      <CampoTexto rotulo="Texto / roteiro" valor={vista.legenda} multilinha onSalvar={(valor) => salvar("legenda", valor)} />
      <CampoTexto rotulo="Chamada" valor={vista.cta ?? ""} onSalvar={(valor) => salvar("cta", valor || null)} />

      <section>
        <h2 className="font-display text-3xl text-gold">Mídia</h2>
        <div
          className={`mt-6 border border-dashed px-4 py-8 ${sobre ? "border-gold" : "border-line"}`}
          onDragOver={(evento) => {
            evento.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={aoSoltar}
        >
          <p className="texto text-paper">Arraste uma imagem ou um vídeo, ou escolha um arquivo.</p>
          <label className="botao mt-4 cursor-pointer">
            Escolher arquivo
            <input
              type="file"
              accept={ACEITOS.join(",")}
              multiple
              className="sr-only"
              onChange={(evento) => {
                void enviarArquivos([...(evento.target.files ?? [])]);
                evento.target.value = "";
              }}
            />
          </label>
          {enviando ? (
            <p className="mt-4 text-mist">
              Enviando {enviando.nome}… <span className="num text-gold">{enviando.porcentagem}%</span>
            </p>
          ) : null}
          {enviando ? (
            <div className="mt-2 h-px bg-line-soft">
              <div className="h-px bg-gold" style={{ width: `${enviando.porcentagem}%` }} />
            </div>
          ) : null}
        </div>
        {listaMidias.length === 0 ? <p className="mt-6 text-mist">Nenhuma mídia ainda.</p> : null}
        <ul className="mt-6 flex flex-col gap-8">
          {listaMidias.map((midia) => (
            <li key={midia.id} className="border-t border-line-soft pt-6">
              {midia.url && midia.tipo === "video" ? (
                <video src={midia.url} controls playsInline preload="metadata" className="w-full" />
              ) : midia.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={midia.url} alt="" className="max-h-[28rem] w-full object-contain" />
              ) : (
                <Moldura className="h-40 w-28" />
              )}
              <p className="mt-3 text-paper">
                {midia.nome_arquivo}
                {midia.e_final ? <span className="ml-3 text-gold">Final</span> : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                {midia.e_final ? null : (
                  <button type="button" className="min-h-11 text-gold" onClick={() => marcarFinal(midia.id)}>
                    Marcar como final
                  </button>
                )}
                <button type="button" className="min-h-11 text-mist" onClick={() => remover(midia)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <BotaoConcluir concluido={Boolean(vista.concluido)} onMudar={(valor) => salvar("concluido", valor)} />
      <Notas pecaId={peca.id} iniciais={comentarios} preview={preview} autorNome={autorNome} />

      <section>
        <h2 className="font-display text-3xl text-gold">Histórico</h2>
        {listaHistorico.length === 0 ? <p className="mt-4 text-mist">Nenhuma alteração ainda.</p> : null}
        <ul className="mt-4 flex flex-col gap-4">
          {listaHistorico.map((item) => (
            <li key={item.id} className="text-paper">
              <p className="texto">
                {ROTULO_CAMPO[item.campo] ?? item.campo}: {textoHistorico(item.campo, item.antes)} para {textoHistorico(item.campo, item.depois)}
              </p>
              <p className="mt-1 text-sm text-mist">
                {item.autor_nome}{" "}
                <span className="num">{quando(item.criado_em)}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function normalizarHorario(valor: string) {
  const texto = valor.trim();
  if (!texto) return null;
  if (/^\d{2}:\d{2}$/.test(texto)) return texto;
  return null;
}

function CampoTexto({
  rotulo,
  valor,
  onSalvar,
  destaque = false,
  multilinha = false,
  tipo = "text",
}: {
  rotulo: string;
  valor: string;
  onSalvar: (valor: string) => Promise<string | null>;
  destaque?: boolean;
  multilinha?: boolean;
  tipo?: "text" | "date" | "time";
}) {
  const [aberto, setAberto] = useState(tipo !== "text");
  const [rascunho, setRascunho] = useState(valor);
  const [erro, setErro] = useState<string | null>(null);
  const id = `campo-${rotulo}`;

  async function confirmar(proximo = rascunho) {
    if (proximo === valor) {
      if (tipo === "text") setAberto(false);
      return;
    }
    const falha = await onSalvar(proximo);
    setErro(falha);
    if (!falha && tipo === "text") setAberto(false);
  }

  return (
    <div>
      <label htmlFor={id} className="text-mist">
        {rotulo}
      </label>
      {destaque && !aberto ? (
        <h1>
          <button
            type="button"
            className="font-display mt-1 block text-left text-4xl text-gold sm:text-5xl"
            onClick={() => {
              setRascunho(valor);
              setAberto(true);
            }}
          >
            {valor || "Sem título"}
          </button>
        </h1>
      ) : multilinha ? (
        <textarea
          id={id}
          className="campo"
          value={rascunho}
          onChange={(evento) => setRascunho(evento.target.value)}
          onBlur={() => void confirmar()}
        />
      ) : (
        <input
          id={id}
          type={tipo}
          className="campo num"
          value={tipo === "text" ? rascunho : valor}
          onChange={(evento) => {
            setRascunho(evento.target.value);
            if (tipo !== "text") void confirmar(evento.target.value);
          }}
          onBlur={() => void confirmar()}
          onKeyDown={(evento) => {
            if (evento.key === "Enter" && tipo === "text") void confirmar();
            if (evento.key === "Escape") {
              setRascunho(valor);
              setAberto(false);
            }
          }}
          autoFocus={destaque}
        />
      )}
      {erro ? <p className="mt-2 text-gold">{erro}</p> : null}
    </div>
  );
}

function CampoSelecao({
  rotulo,
  valor,
  opcoes,
  onSalvar,
}: {
  rotulo: string;
  valor: string;
  opcoes: { valor: string; nome: string }[];
  onSalvar: (valor: string) => Promise<string | null>;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const id = `sel-${rotulo}`;
  return (
    <div>
      <label htmlFor={id} className="text-mist">
        {rotulo}
      </label>
      <select
        id={id}
        className="campo"
        value={valor}
        onChange={async (evento) => {
          const falha = await onSalvar(evento.target.value);
          setErro(falha);
        }}
      >
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.nome}
          </option>
        ))}
      </select>
      {erro ? <p className="mt-2 text-gold">{erro}</p> : null}
    </div>
  );
}
