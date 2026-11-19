"use client";

import { useState } from "react";
import { definirStatusMembro } from "@/lib/acoes";
import { quando } from "@/lib/datas";
import type { Membro, StatusPerfil } from "@/lib/tipos";

const GRUPOS: { status: StatusPerfil; titulo: string; vazio: string; acoes: Array<"aprovado" | "recusado"> }[] = [
  { status: "pendente", titulo: "Aguardando", vazio: "Ninguém aguardando.", acoes: ["aprovado", "recusado"] },
  { status: "aprovado", titulo: "Na equipe", vazio: "Ainda não há ninguém aprovado.", acoes: [] },
  { status: "recusado", titulo: "Sem acesso", vazio: "Ninguém recusado.", acoes: ["aprovado"] },
];

export function ListaEquipe({ iniciais, meuId, preview }: { iniciais: Membro[]; meuId: string; preview: boolean }) {
  const [membros, setMembros] = useState(iniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function decidir(membro: Membro, status: "aprovado" | "recusado") {
    if (membro.id === meuId || ocupado) return;
    const anterior = membros;
    const proxima = anterior.map((item) => (item.id === membro.id ? { ...item, status } : item));
    setOcupado(`${membro.id}:${status}`);
    setErro(null);
    setAviso(null);
    setMembros(proxima);
    window.dispatchEvent(new CustomEvent("mirage-pendentes", { detail: proxima.filter((item) => item.status === "pendente").length }));

    if (preview) {
      setAviso("Nesta prévia a decisão fica só nesta tela.");
      setOcupado(null);
      return;
    }

    const resposta = await definirStatusMembro(membro.id, status);
    if (resposta?.erro) {
      setMembros(anterior);
      window.dispatchEvent(
        new CustomEvent("mirage-pendentes", { detail: anterior.filter((item) => item.status === "pendente").length }),
      );
      setErro(resposta.erro);
    }
    setOcupado(null);
  }

  return (
    <div className="mx-auto flex max-w-[40rem] flex-col gap-16">
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p role="status" className="text-paper">
          {aviso}
        </p>
      ) : null}
      {GRUPOS.map((grupo) => {
        const itens = membros.filter((membro) => membro.status === grupo.status);
        return (
          <section key={grupo.status} aria-labelledby={`equipe-${grupo.status}`}>
            <h2 id={`equipe-${grupo.status}`} className="font-display text-3xl text-gold">
              {grupo.titulo}
              {grupo.status === "pendente" && itens.length > 0 ? <span className="ml-3">{itens.length}</span> : null}
            </h2>
            {itens.length === 0 ? (
              <p className="mt-6 text-paper">{grupo.vazio}</p>
            ) : (
              <ul className="mt-6">
                {itens.map((membro) => (
                  <li key={membro.id} className="border-t border-line-soft py-6">
                    <p className="text-paper">
                      {membro.nome}
                      {membro.id === meuId ? <span className="text-mist"> · você</span> : null}
                    </p>
                    <p className="text-sm text-mist">{membro.email ?? "Sem e-mail"}</p>
                    <p className="text-sm text-mist">Cadastro {quando(membro.criado_em)}</p>
                    {grupo.acoes.length > 0 && membro.id !== meuId ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {grupo.acoes.map((acao) => {
                          const rotulo = acao === "aprovado" ? "Aprovar" : "Recusar";
                          const chave = `${membro.id}:${acao}`;
                          return (
                            <button
                              key={acao}
                              type="button"
                              className="botao"
                              disabled={ocupado !== null}
                              aria-label={`${rotulo} ${membro.nome}`}
                              onClick={() => decidir(membro, acao)}
                            >
                              {ocupado === chave ? "Salvando…" : rotulo}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
