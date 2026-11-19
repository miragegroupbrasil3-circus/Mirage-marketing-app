"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cadastrar, entrar } from "@/lib/acoes";

export function FormularioLogin({ next }: { next: string }) {
  const reduzir = useReducedMotion();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  function trocarModo() {
    setModo((atual) => (atual === "entrar" ? "criar" : "entrar"));
    setErro(null);
    setAviso(null);
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setPendente(true);
    setErro(null);
    setAviso(null);
    const dados = new FormData(evento.currentTarget);
    const resposta = modo === "criar" ? await cadastrar(dados) : await entrar(dados);
    if (!resposta?.erro && !resposta?.aviso) return;
    if (resposta.erro) setErro(resposta.erro);
    if (resposta.aviso) setAviso(resposta.aviso);
    setPendente(false);
  }

  const criando = modo === "criar";

  return (
    <motion.form
      onSubmit={aoEnviar}
      className="flex w-full max-w-sm flex-col gap-6"
      initial={reduzir ? false : { y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      noValidate
    >
      {criando ? (
        <div>
          <label htmlFor="nome" className="text-paper">
            Nome
          </label>
          <input id="nome" name="nome" type="text" autoComplete="name" required maxLength={120} className="campo" />
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className="text-paper">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete={criando ? "email" : "username"}
          required
          className="campo"
        />
      </div>
      <div>
        <label htmlFor="senha" className="text-paper">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete={criando ? "new-password" : "current-password"}
          required
          minLength={criando ? 6 : undefined}
          className="campo"
        />
        {criando ? <p className="mt-2 text-sm text-mist">Mínimo de 6 caracteres.</p> : null}
      </div>
      <input type="hidden" name="next" value={next} />
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
      <button type="submit" className="botao botao-cheio" disabled={pendente}>
        {pendente ? (criando ? "Criando…" : "Entrando…") : criando ? "Criar conta" : "Entrar"}
      </button>
      <button type="button" className="link mx-auto" onClick={trocarModo}>
        {criando ? "Já tenho conta" : "Criar conta"}
      </button>
    </motion.form>
  );
}
