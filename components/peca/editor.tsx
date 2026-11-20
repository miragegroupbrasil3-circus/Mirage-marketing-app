"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Moldura } from "@/components/marca/moldura";
import { BarraSalvar, CamposPecaForm } from "@/components/peca/campos";
import { BotaoConcluir } from "@/components/peca/concluir";
import { Notas } from "@/components/peca/notas";
import { AvisoDesfazer, Confirmar } from "@/components/ui/confirmar";
import { caminhoMidia } from "@/lib/caminho";
import { quando } from "@/lib/datas";
import { enviarParaStorage, medidasDoArquivo, tokenDeEnvio } from "@/lib/envio";
import { excluirPecaNoBanco } from "@/lib/excluir-peca";
import { camposDePeca, camposIguais, payloadPeca, validarCamposPeca, type CamposPeca } from "@/lib/peca-campos";
import { ROTULO_CAMPO, textoHistorico } from "@/lib/rotulos";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { LIMITE_ARQUIVO, mensagemArquivoGrande, type Comentario, type ItemHistorico, type Midia, type Peca } from "@/lib/tipos";

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
  const base = camposDePeca(peca);
  const [form, setForm] = useState(base);
  const [origem, setOrigem] = useState(base);
  const [trilha, setTrilha] = useState(historico);
  const [pendente, setPendente] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [desfazer, setDesfazer] = useState(false);
  const [feito, setFeito] = useState(peca.concluido);
  const [feitoOrigem, setFeitoOrigem] = useState(peca.concluido);
  if (peca.concluido !== feitoOrigem) {
    setFeitoOrigem(peca.concluido);
    setFeito(peca.concluido);
  }
  const timerExclusao = useRef<number | null>(null);
  if (!camposIguais(base, origem)) {
    const editando = !camposIguais(form, origem);
    setOrigem(base);
    if (!editando) setForm(base);
  }
  const sujo = !camposIguais(form, origem);

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

  useEffect(() => {
    return () => {
      if (timerExclusao.current != null && !preview) {
        window.clearTimeout(timerExclusao.current);
        void excluirPecaNoBanco(peca.id);
      }
    };
  }, [peca.id, preview]);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const falha = validarCamposPeca(form);
    if (falha) {
      setErro(falha);
      return;
    }
    setErro(null);
    const payload = payloadPeca(form);
    if (preview) {
      const mudancas = (Object.keys(payload) as (keyof CamposPeca)[]).filter((campo) => form[campo] !== origem[campo]);
      setTrilha((atual) => [
        ...mudancas.map((campo) => ({
          id: `local-${crypto.randomUUID()}`,
          peca_id: peca.id,
          autor_id: null,
          campo,
          antes: origem[campo] || null,
          depois: form[campo] || null,
          criado_em: new Date().toISOString(),
          autor_nome: autorNome,
        })),
        ...atual,
      ]);
      setOrigem(form);
      return;
    }
    setPendente(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pecas").update(payload).eq("id", peca.id);
    setPendente(false);
    if (error) {
      setErro("Não foi possível guardar.");
      return;
    }
    setOrigem(form);
    router.refresh();
  }

  async function concluir(valor: boolean) {
    setErro(null);
    setFeito(valor);
    if (preview) {
      setTrilha((atual) => [
        {
          id: `local-${crypto.randomUUID()}`,
          peca_id: peca.id,
          autor_id: null,
          campo: "concluido",
          antes: !valor,
          depois: valor,
          criado_em: new Date().toISOString(),
          autor_nome: autorNome,
        },
        ...atual,
      ]);
      return null;
    }
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("pecas").update({ concluido: valor }).eq("id", peca.id);
    if (error) {
      setFeito(!valor);
      return "Não foi possível guardar.";
    }
    router.refresh();
    return null;
  }

  function pedirExclusao() {
    setConfirmarExclusao(false);
    setDesfazer(true);
    timerExclusao.current = window.setTimeout(() => {
      timerExclusao.current = null;
      void concluirExclusao();
    }, 5000);
  }

  function cancelarExclusao() {
    if (timerExclusao.current != null) window.clearTimeout(timerExclusao.current);
    timerExclusao.current = null;
    setDesfazer(false);
  }

  async function concluirExclusao() {
    if (!preview) {
      const falha = await excluirPecaNoBanco(peca.id);
      if (falha) {
        setDesfazer(false);
        setErro(falha);
        return;
      }
    }
    router.push(`/calendario?dia=${peca.data}`);
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
        data: peca.data,
        pecaSlug: peca.slug,
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

      <form className="flex flex-col gap-8" onSubmit={guardar}>
        <CamposPecaForm idPrefix={`editor-${peca.id}`} valor={form} onChange={setForm} destaque />
        <BarraSalvar sujo={sujo} pendente={pendente} />
        <button type="button" className="min-h-11 self-start text-crimson" onClick={() => setConfirmarExclusao(true)}>
          Excluir peça
        </button>
      </form>

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

      <BotaoConcluir concluido={feito} onMudar={concluir} />
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
      <Confirmar
        aberto={confirmarExclusao}
        titulo="Excluir peça?"
        texto="A peça sai do calendário e o dia fica vazio se não houver outra. Comentários, histórico e arquivos também são removidos. O progresso recalcula."
        confirmar="Excluir peça"
        onCancelar={() => setConfirmarExclusao(false)}
        onConfirmar={pedirExclusao}
      />
      {desfazer ? <AvisoDesfazer mensagem="Peça excluída." onDesfazer={cancelarExclusao} /> : null}
    </article>
  );
}
