"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { entrar } from "@/lib/acoes";

export function FormularioLogin({ next }: { next: string }) {
  const reduzir = useReducedMotion();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setPendente(true);
    setErro(null);
    const resposta = await entrar(new FormData(evento.currentTarget));
    if (resposta?.erro) {
      setErro(resposta.erro);
      setPendente(false);
    }
  }

  return (
    <motion.form
      onSubmit={aoEnviar}
      className="flex w-full max-w-sm flex-col gap-6"
      initial={reduzir ? false : { y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      noValidate
    >
      <div>
        <label htmlFor="email" className="text-paper">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="campo" />
      </div>
      <div>
        <label htmlFor="senha" className="text-paper">
          Senha
        </label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required className="campo" />
      </div>
      <input type="hidden" name="next" value={next} />
      {erro ? (
        <p role="alert" className="text-gold">
          {erro}
        </p>
      ) : null}
      <button type="submit" className="botao botao-cheio" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </motion.form>
  );
}
