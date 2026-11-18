"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-[40rem]">
      <h1 className="font-display text-4xl text-gold">A grade não carregou</h1>
      <p className="mt-4 text-paper">Tente de novo. Se continuar, confira a conexão com o Supabase.</p>
      <button type="button" className="botao mt-6" onClick={reset}>
        Tentar de novo
      </button>
    </div>
  );
}
