import { Logo } from "@/components/marca/logo";

export const metadata = { title: "Sem conexão" };

export default function PaginaOffline() {
  return (
    <main id="conteudo" className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Logo tamanho="repouso" />
      <h1 className="font-display text-4xl text-gold">Sem conexão</h1>
      <p className="texto max-w-[28rem] text-paper">A grade volta quando a rede voltar.</p>
      <a href="/calendario" className="botao">
        Tentar de novo
      </a>
    </main>
  );
}
