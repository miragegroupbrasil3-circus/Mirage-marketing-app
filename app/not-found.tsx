import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center gap-6 px-6">
      <h1 className="font-display text-5xl text-gold">Não encontramos</h1>
      <p className="text-paper">Essa página não faz parte da grade.</p>
      <Link href="/calendario" className="botao">
        Voltar para hoje
      </Link>
    </main>
  );
}
