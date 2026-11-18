import { Entrada } from "@/components/painel/entrada";
import { NavBase } from "@/components/painel/nav-base";
import { Topo } from "@/components/painel/topo";
import { listarPracas, obterSessao, pracaAtiva } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  let semConfiguracao = false;
  let sessao: Awaited<ReturnType<typeof obterSessao>> = null;
  let pracas: Awaited<ReturnType<typeof listarPracas>> = [];

  try {
    sessao = await obterSessao();
    pracas = await listarPracas();
  } catch (erro) {
    if (erro instanceof Error && erro.message === "config") semConfiguracao = true;
    else throw erro;
  }

  const atual = await pracaAtiva(pracas);
  const preview = previewAtivo();

  return (
    <div className="min-h-dvh bg-ink">
      {preview ? (
        <p className="border-b border-line px-5 py-2 text-center text-sm text-gold">Prévia local. Peças de exemplo, sem temporada real.</p>
      ) : null}
      <Topo pracas={pracas} pracaId={atual?.id ?? null} nome={sessao?.nome ?? "Equipe"} />
      <main id="conteudo" className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-8 md:px-10 md:pb-16">
        {semConfiguracao ? (
          <p className="max-w-[40rem] text-paper">O acesso ainda não está configurado neste servidor.</p>
        ) : sessao?.semPerfil ? (
          <p className="max-w-[40rem] text-paper">Seu acesso ainda não tem perfil. O cadastro no Supabase precisa criar a linha em perfis.</p>
        ) : (
          <Entrada>{children}</Entrada>
        )}
      </main>
      <NavBase />
    </div>
  );
}
