"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaixaProgresso } from "@/components/progresso/faixa";
import { Confirmar } from "@/components/ui/confirmar";
import { COR_DEMANDA, COR_STATUS_DEMANDA } from "@/lib/cores";
import { rotuloDiaMes } from "@/lib/datas";
import { ROTULO_STATUS_DEMANDA, ROTULO_TIPO_DEMANDA } from "@/lib/rotulos";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { cx } from "@/lib/cx";
import {
  STATUS_DEMANDA,
  TIPOS_DEMANDA,
  type Demanda,
  type StatusDemanda,
  type TipoDemanda,
} from "@/lib/tipos";

type Rascunho = {
  tipo: TipoDemanda;
  titulo: string;
  descricao: string;
  prazo: string;
  responsavel_id: string;
  status: StatusDemanda;
};

const vazio: Rascunho = {
  tipo: "flyer",
  titulo: "",
  descricao: "",
  prazo: "",
  responsavel_id: "",
  status: "a_fazer",
};

const ORDEM: Record<StatusDemanda, number> = { a_fazer: 0, fazendo: 1, feito: 2 };

export function SecaoDemandas({
  iniciais,
  pracaId,
  preview,
  autorId,
  membros,
}: {
  iniciais: Demanda[];
  pracaId: string;
  preview: boolean;
  autorId: string;
  membros: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const assinatura = iniciais.map((item) => `${item.id}:${item.titulo}:${item.status}:${item.tipo}:${item.prazo}:${item.responsavel_id}:${item.descricao}`).join("|");
  const [itens, setItens] = useState(iniciais);
  const [vista, setVista] = useState(assinatura);
  const [tipo, setTipo] = useState<TipoDemanda | "todas">("todas");
  const [status, setStatus] = useState<StatusDemanda | "todos">("todos");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<Demanda | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (assinatura !== vista) {
    setVista(assinatura);
    setItens(iniciais);
  }

  useEffect(() => {
    if (preview) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`demandas:${pracaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "demandas", filter: `praca_id=eq.${pracaId}` }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [pracaId, preview, router]);

  const nomes = useMemo(() => new Map(membros.map((membro) => [membro.id, membro.nome])), [membros]);
  const feitas = itens.filter((item) => item.status === "feito").length;
  const visiveis = itens
    .filter((item) => (tipo === "todas" ? true : item.tipo === tipo) && (status === "todos" ? true : item.status === status))
    .sort((a, b) => ORDEM[a.status] - ORDEM[b.status] || (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999") || a.titulo.localeCompare(b.titulo, "pt-BR"));

  async function criar(rascunho: Rascunho) {
    const falha = validar(rascunho);
    if (falha) return falha;
    const agora = new Date().toISOString();
    const demanda: Demanda = {
      id: `local-${crypto.randomUUID()}`,
      praca_id: pracaId,
      tipo: rascunho.tipo,
      titulo: rascunho.titulo.trim(),
      descricao: rascunho.descricao.trim() || null,
      prazo: rascunho.prazo || null,
      responsavel_id: rascunho.responsavel_id || null,
      status: rascunho.status,
      criado_por: autorId || null,
      criado_em: agora,
      atualizado_em: agora,
      concluido_em: rascunho.status === "feito" ? agora : null,
    };
    setItens((atual) => [demanda, ...atual]);
    if (preview) return null;
    const supabase = criarClienteNavegador();
    const { data, error } = await supabase
      .from("demandas")
      .insert({
        praca_id: pracaId,
        tipo: demanda.tipo,
        titulo: demanda.titulo,
        descricao: demanda.descricao,
        prazo: demanda.prazo,
        responsavel_id: demanda.responsavel_id,
        status: demanda.status,
      })
      .select("id, concluido_em")
      .single();
    if (error || !data) {
      setItens((atual) => atual.filter((item) => item.id !== demanda.id));
      return "Não foi possível guardar a demanda.";
    }
    setItens((atual) => atual.map((item) => (item.id === demanda.id ? { ...item, id: data.id, concluido_em: data.concluido_em } : item)));
    return null;
  }

  async function guardar(id: string, rascunho: Rascunho) {
    const falha = validar(rascunho);
    if (falha) return falha;
    const patch = {
      tipo: rascunho.tipo,
      titulo: rascunho.titulo.trim(),
      descricao: rascunho.descricao.trim() || null,
      prazo: rascunho.prazo || null,
      responsavel_id: rascunho.responsavel_id || null,
      status: rascunho.status,
    };
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, ...patch, concluido_em: patch.status === "feito" ? item.concluido_em ?? new Date().toISOString() : null } : item)));
    if (preview || id.startsWith("local-")) return null;
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("demandas").update(patch).eq("id", id);
    if (error) {
      router.refresh();
      return "Não foi possível guardar a demanda.";
    }
    return null;
  }

  async function mudarStatus(demanda: Demanda, proximo: StatusDemanda) {
    if (demanda.status === proximo) return;
    setItens((atual) =>
      atual.map((item) =>
        item.id === demanda.id
          ? { ...item, status: proximo, concluido_em: proximo === "feito" ? new Date().toISOString() : null }
          : item,
      ),
    );
    if (preview || demanda.id.startsWith("local-")) return;
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("demandas").update({ status: proximo }).eq("id", demanda.id);
    if (error) {
      setErro("Não foi possível mudar o estado.");
      router.refresh();
    }
  }

  async function remover(demanda: Demanda) {
    setItens((atual) => atual.filter((item) => item.id !== demanda.id));
    setEditando(null);
    if (preview || demanda.id.startsWith("local-")) return;
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("demandas").delete().eq("id", demanda.id);
    if (error) {
      setErro("Não foi possível excluir a demanda.");
      router.refresh();
    }
  }

  return (
    <section className="mt-16" aria-labelledby="demandas-titulo">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-magenta">Equipe</p>
          <h2 id="demandas-titulo" className="font-display mt-1 text-4xl text-gold">
            Demandas
          </h2>
          <p className="texto mt-2 max-w-xl text-paper">Pedidos desta praça, separados das peças do calendário.</p>
        </div>
        {criando ? null : (
          <button type="button" className="botao self-start" onClick={() => setCriando(true)}>
            Nova demanda
          </button>
        )}
      </div>

      <div className="cartao-circo mt-6 rounded-3xl p-4">
        <FaixaProgresso feitas={feitas} total={itens.length} rotulo="Demandas feitas" vazio="Demandas feitas: nenhuma neste momento." />
      </div>

      <Filtros tipo={tipo} status={status} onTipo={setTipo} onStatus={setStatus} />
      {erro ? (
        <p role="alert" className="mt-4 text-gold">
          {erro}
        </p>
      ) : null}

      <div className={cx("mt-6 grid items-start gap-6", criando && "lg:grid-cols-[minmax(0,1fr)_22rem]")}>
        <div className={criando ? "order-2 lg:order-1" : undefined}>
          {itens.length === 0 && !criando ? <Vazio onCriar={() => setCriando(true)} /> : null}
          {itens.length > 0 && visiveis.length === 0 ? <p className="text-mist">Nenhuma demanda com esse filtro.</p> : null}
          <ul className="flex flex-col gap-3">
            {visiveis.map((demanda) =>
              editando === demanda.id ? (
                <li key={demanda.id}>
                  <FormularioDemanda
                    titulo="Editar demanda"
                    inicial={deDemanda(demanda)}
                    membros={membros}
                    onCancelar={() => setEditando(null)}
                    onSalvar={async (rascunho) => {
                      const falha = await guardar(demanda.id, rascunho);
                      if (!falha) setEditando(null);
                      return falha;
                    }}
                  />
                </li>
              ) : (
                <li key={demanda.id}>
                  <Cartao
                    demanda={demanda}
                    responsavel={demanda.responsavel_id ? nomes.get(demanda.responsavel_id) ?? "Equipe" : null}
                    onEditar={() => setEditando(demanda.id)}
                    onExcluir={() => setExcluir(demanda)}
                    onStatus={(proximo) => void mudarStatus(demanda, proximo)}
                  />
                </li>
              ),
            )}
          </ul>
        </div>
        {criando ? (
          <FormularioDemanda
            className="order-1 lg:sticky lg:top-4 lg:order-2"
            titulo="Nova demanda"
            inicial={vazio}
            membros={membros}
            onCancelar={() => setCriando(false)}
            onSalvar={async (rascunho) => {
              const falha = await criar(rascunho);
              if (!falha) setCriando(false);
              return falha;
            }}
          />
        ) : null}
      </div>

      <Confirmar
        aberto={excluir != null}
        titulo="Excluir demanda?"
        texto={excluir ? `“${excluir.titulo}” sai da lista desta praça.` : ""}
        confirmar="Excluir"
        onCancelar={() => setExcluir(null)}
        onConfirmar={() => {
          if (excluir) void remover(excluir);
          setExcluir(null);
        }}
      />
    </section>
  );
}

function Filtros({
  tipo,
  status,
  onTipo,
  onStatus,
}: {
  tipo: TipoDemanda | "todas";
  status: StatusDemanda | "todos";
  onTipo: (valor: TipoDemanda | "todas") => void;
  onStatus: (valor: StatusDemanda | "todos") => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto">
        <Chip ativo={tipo === "todas"} onClick={() => onTipo("todas")}>
          Todos os tipos
        </Chip>
        {TIPOS_DEMANDA.map((item) => (
          <Chip key={item} ativo={tipo === item} cor={COR_DEMANDA[item]} onClick={() => onTipo(item)}>
            {ROTULO_TIPO_DEMANDA[item]}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        <Chip ativo={status === "todos"} onClick={() => onStatus("todos")}>
          Todos os estados
        </Chip>
        {STATUS_DEMANDA.map((item) => (
          <Chip key={item} ativo={status === item} cor={COR_STATUS_DEMANDA[item]} onClick={() => onStatus(item)}>
            {ROTULO_STATUS_DEMANDA[item]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ ativo, cor, onClick, children }: { ativo: boolean; cor?: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cx("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm", ativo ? "border-gold text-gold" : "border-white/15 text-paper")}
    >
      {cor ? <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function Vazio({ onCriar }: { onCriar: () => void }) {
  return (
    <div className="cartao-circo mt-6 rounded-3xl px-6 py-10 text-center">
      <p className="font-display text-3xl text-gold">Nenhuma demanda ainda</p>
      <p className="texto mx-auto mt-3 max-w-md text-paper">Um flyer, um story, uma arte para o feed. Peça aqui e a lista fica ao vivo para a equipe.</p>
      <button type="button" className="botao mt-6" onClick={onCriar}>
        Nova demanda
      </button>
    </div>
  );
}

function Cartao({
  demanda,
  responsavel,
  onEditar,
  onExcluir,
  onStatus,
}: {
  demanda: Demanda;
  responsavel: string | null;
  onEditar: () => void;
  onExcluir: () => void;
  onStatus: (status: StatusDemanda) => void;
}) {
  return (
    <article className="cartao-circo flex gap-3 rounded-2xl p-4">
      <Icone tipo={demanda.tipo} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-paper">{demanda.titulo}</h3>
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-ink" style={{ background: COR_DEMANDA[demanda.tipo] }}>
            {ROTULO_TIPO_DEMANDA[demanda.tipo]}
          </span>
        </div>
        {demanda.descricao ? <p className="texto mt-1 text-sm text-mist">{demanda.descricao}</p> : null}
        <p className="mt-2 text-sm text-paper">
          {demanda.prazo ? <span className="num">Prazo {rotuloDiaMes(demanda.prazo)}</span> : <span>Sem prazo</span>}
          <span className="text-mist"> · {responsavel ?? "Sem responsável"}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Estado de ${demanda.titulo}`}>
          {STATUS_DEMANDA.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={demanda.status === item}
              className={cx("min-h-11 rounded-full border px-3 text-sm", demanda.status === item ? "border-gold text-gold" : "border-white/15 text-mist")}
              onClick={() => onStatus(item)}
            >
              {ROTULO_STATUS_DEMANDA[item]}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-4">
          <button type="button" className="min-h-11 text-gold" onClick={onEditar}>
            Editar
          </button>
          <button type="button" className="min-h-11 text-crimson" onClick={onExcluir}>
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

function FormularioDemanda({
  titulo,
  inicial,
  membros,
  onSalvar,
  onCancelar,
  className,
}: {
  titulo: string;
  inicial: Rascunho;
  membros: { id: string; nome: string }[];
  onSalvar: (rascunho: Rascunho) => Promise<string | null>;
  onCancelar: () => void;
  className?: string;
}) {
  const [form, setForm] = useState(inicial);
  const [base, setBase] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const [descarte, setDescarte] = useState(false);
  const sujo = !igual(form, base);

  if (!igual(inicial, base) && igual(form, base)) {
    setBase(inicial);
    setForm(inicial);
  }

  function pedirCancelar() {
    if (sujo) setDescarte(true);
    else onCancelar();
  }

  return (
    <form
      className={cx("cartao-circo flex flex-col gap-4 rounded-3xl p-5", className)}
      onSubmit={async (evento) => {
        evento.preventDefault();
        const falha = validar(form);
        if (falha) {
          setErro(falha);
          return;
        }
        setPendente(true);
        const resultado = await onSalvar(form);
        setPendente(false);
        setErro(resultado);
        if (!resultado) setBase(form);
      }}
    >
      <h3 className="font-display text-2xl text-gold">{titulo}</h3>
      <p className="text-sm text-mist">Nada é gravado até você tocar em Salvar.</p>
      <label className="text-sm text-mist" htmlFor={`${titulo}-titulo`}>
        Título
        <input id={`${titulo}-titulo`} className="campo" required maxLength={180} value={form.titulo} onChange={(evento) => setForm({ ...form, titulo: evento.target.value })} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-mist" htmlFor={`${titulo}-tipo`}>
          Tipo
          <select id={`${titulo}-tipo`} className="campo" value={form.tipo} onChange={(evento) => setForm({ ...form, tipo: evento.target.value as TipoDemanda })}>
            {TIPOS_DEMANDA.map((item) => (
              <option key={item} value={item}>
                {ROTULO_TIPO_DEMANDA[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-mist" htmlFor={`${titulo}-status`}>
          Estado
          <select id={`${titulo}-status`} className="campo" value={form.status} onChange={(evento) => setForm({ ...form, status: evento.target.value as StatusDemanda })}>
            {STATUS_DEMANDA.map((item) => (
              <option key={item} value={item}>
                {ROTULO_STATUS_DEMANDA[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-mist" htmlFor={`${titulo}-prazo`}>
          Prazo
          <input id={`${titulo}-prazo`} type="date" className="campo num" value={form.prazo} onChange={(evento) => setForm({ ...form, prazo: evento.target.value })} />
        </label>
        <label className="text-sm text-mist" htmlFor={`${titulo}-responsavel`}>
          Responsável
          <select id={`${titulo}-responsavel`} className="campo" value={form.responsavel_id} onChange={(evento) => setForm({ ...form, responsavel_id: evento.target.value })}>
            <option value="">Sem responsável</option>
            {membros.map((membro) => (
              <option key={membro.id} value={membro.id}>
                {membro.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="text-sm text-mist" htmlFor={`${titulo}-descricao`}>
        Descrição
        <textarea id={`${titulo}-descricao`} className="campo" maxLength={4000} value={form.descricao} onChange={(evento) => setForm({ ...form, descricao: evento.target.value })} />
      </label>
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="botao" disabled={!sujo || pendente}>
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        {sujo ? <p className="text-sm text-gold">Alterações não salvas</p> : null}
        <button type="button" className="botao" onClick={pedirCancelar}>
          Cancelar
        </button>
      </div>
      <Confirmar
        aberto={descarte}
        titulo="Descartar rascunho?"
        texto="O que você digitou sai desta tela e não entra na lista."
        confirmar="Descartar"
        onCancelar={() => setDescarte(false)}
        onConfirmar={() => {
          setDescarte(false);
          onCancelar();
        }}
      />
    </form>
  );
}

function Icone({ tipo }: { tipo: TipoDemanda }) {
  const cor = COR_DEMANDA[tipo];
  return (
    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${cor}22`, color: cor }} aria-hidden="true">
      {tipo === "video" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M3 4.5h8.2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Zm10 2.2 3-1.6v8.8l-3-1.6V6.7Z" />
        </svg>
      ) : tipo === "story" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5" y="2" width="8" height="14" rx="2" />
        </svg>
      ) : tipo === "arte_feed" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2" y="2" width="14" height="14" rx="2" />
          <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M3.5 13.5 7 9.5l2.2 2.4 1.6-1.6 3.7 3.2" />
        </svg>
      ) : tipo === "flyer" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 2.5h6l3 3V15.5H5V2.5Z" />
          <path d="M11 2.5V6h3.2" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="9" cy="9" r="2.2" />
        </svg>
      )}
    </span>
  );
}

function deDemanda(demanda: Demanda): Rascunho {
  return {
    tipo: demanda.tipo,
    titulo: demanda.titulo,
    descricao: demanda.descricao ?? "",
    prazo: demanda.prazo ?? "",
    responsavel_id: demanda.responsavel_id ?? "",
    status: demanda.status,
  };
}

function igual(a: Rascunho, b: Rascunho) {
  return a.tipo === b.tipo && a.titulo === b.titulo && a.descricao === b.descricao && a.prazo === b.prazo && a.responsavel_id === b.responsavel_id && a.status === b.status;
}

function validar(rascunho: Rascunho) {
  const titulo = rascunho.titulo.trim();
  if (!titulo) return "O título é obrigatório.";
  if (titulo.length > 180) return "O título pode ter no máximo 180 caracteres.";
  if (rascunho.descricao.length > 4000) return "A descrição passa de 4000 caracteres.";
  return null;
}
