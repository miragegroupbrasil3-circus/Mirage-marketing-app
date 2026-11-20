"use client";

import { ROTULO_PILAR, ROTULO_STATUS, ROTULO_TIPO } from "@/lib/rotulos";
import { mensagemTituloPeca, type CamposPeca } from "@/lib/peca-campos";
import { PILARES, STATUS_PECA, TIPOS_PECA, type Pilar, type StatusPeca, type TipoPeca } from "@/lib/tipos";

export function CamposPecaForm({
  idPrefix,
  valor,
  onChange,
  destaque = false,
}: {
  idPrefix: string;
  valor: CamposPeca;
  onChange: (proximo: CamposPeca) => void;
  destaque?: boolean;
}) {
  function set<K extends keyof CamposPeca>(chave: K, proximo: CamposPeca[K]) {
    onChange({ ...valor, [chave]: proximo });
  }

  const erroTitulo = valor.titulo.trim() ? mensagemTituloPeca(valor.titulo) : null;

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm text-mist" htmlFor={`${idPrefix}-titulo`}>
        Título
        <input
          id={`${idPrefix}-titulo`}
          className={destaque ? "campo font-display text-4xl text-gold" : "campo font-display text-2xl text-gold"}
          value={valor.titulo}
          maxLength={180}
          required
          placeholder="O nome da peça"
          onChange={(evento) => set("titulo", evento.target.value)}
        />
      </label>
      {erroTitulo ? (
        <p role="alert" className="text-sm text-gold">
          {erroTitulo}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Rotulo id={`${idPrefix}-tipo`} nome="Formato">
          <select id={`${idPrefix}-tipo`} className="campo" value={valor.tipo} onChange={(evento) => set("tipo", evento.target.value as TipoPeca)}>
            {TIPOS_PECA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ROTULO_TIPO[tipo]}
              </option>
            ))}
          </select>
        </Rotulo>
        <Rotulo id={`${idPrefix}-data`} nome="Data">
          <input id={`${idPrefix}-data`} type="date" className="campo num" required value={valor.data} onChange={(evento) => set("data", evento.target.value)} />
        </Rotulo>
        <Rotulo id={`${idPrefix}-horario`} nome="Horário">
          <input
            id={`${idPrefix}-horario`}
            className="campo num"
            value={valor.horario}
            placeholder="18:00"
            inputMode="numeric"
            onChange={(evento) => set("horario", evento.target.value)}
          />
        </Rotulo>
        <Rotulo id={`${idPrefix}-status`} nome="Estado">
          <select id={`${idPrefix}-status`} className="campo" value={valor.status} onChange={(evento) => set("status", evento.target.value as StatusPeca)}>
            {STATUS_PECA.map((status) => (
              <option key={status} value={status}>
                {ROTULO_STATUS[status]}
              </option>
            ))}
          </select>
        </Rotulo>
        <Rotulo id={`${idPrefix}-pilar`} nome="Pilar">
          <select id={`${idPrefix}-pilar`} className="campo" value={valor.pilar} onChange={(evento) => set("pilar", evento.target.value as Pilar)}>
            {PILARES.map((pilar) => (
              <option key={pilar} value={pilar}>
                {ROTULO_PILAR[pilar]}
              </option>
            ))}
          </select>
        </Rotulo>
      </div>
      <Rotulo id={`${idPrefix}-legenda`} nome="Texto / roteiro">
        <textarea id={`${idPrefix}-legenda`} className="campo" value={valor.legenda} maxLength={5000} onChange={(evento) => set("legenda", evento.target.value)} />
      </Rotulo>
      <Rotulo id={`${idPrefix}-cta`} nome="Chamada">
        <input id={`${idPrefix}-cta`} className="campo" value={valor.cta} maxLength={280} onChange={(evento) => set("cta", evento.target.value)} />
      </Rotulo>
    </div>
  );
}

function Rotulo({ id, nome, children }: { id: string; nome: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-mist" htmlFor={id}>
      {nome}
      {children}
    </label>
  );
}

export function BarraSalvar({ sujo, pendente, rotulo = "Salvar" }: { sujo: boolean; pendente: boolean; rotulo?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" className="botao" disabled={!sujo || pendente}>
        {pendente ? "Salvando…" : rotulo}
      </button>
      {sujo ? <p className="text-sm text-gold">Alterações não salvas</p> : null}
    </div>
  );
}
