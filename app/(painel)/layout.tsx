import { redirect } from "next/navigation";
import { CamadaCena } from "@/components/cena/camada";
import { EquipeAoVivo } from "@/components/painel/equipe-ao-vivo";
import { Entrada } from "@/components/painel/entrada";
import { NavBase } from "@/components/painel/nav-base";
import { Topo } from "@/components/painel/topo";
import { contarPendentes, listarPracas, obterSessao, pracaAtiva } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";
import type { Praca } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const preview = previewAtivo();
  let semConfiguracao = false;
  let sessao: Awaited<ReturnType<typeof obterSessao>> = null;
  let pracas: Praca[] = [];
  let pendentes = 0;

  try {
    sessao = await obterSessao();
  } catch (erro) {
    if (erro instanceof Error && erro.message === "config") semConfiguracao = true;
    else throw erro;
  }

  if (!preview && !semConfiguracao) {
    if (!sessao) redirect("/login");
    if (sessao.status === "recusado") redirect("/recusado");
    if (sessao.status !== "aprovado") redirect("/aguardando");
  }

  if (!semConfiguracao) {
    try {
      [pracas, pendentes] = await Promise.all([listarPracas(), contarPendentes()]);
    } catch (erro) {
      if (erro instanceof Error && erro.message === "config") semConfiguracao = true;
      else throw erro;
    }
  }

  const atual = await pracaAtiva(pracas);

  return (
    <div className="relative min-h-dvh bg-ink">
      <CamadaCena />
      <div className="relative z-10">
      {preview ? (
        <p className="border-b border-gold/30 bg-black/40 px-5 py-2 text-center text-sm text-gold">
          Prévia local com peças de exemplo. Nada disto é a temporada real.
        </p>
      ) : null}
      <Topo pracas={pracas} pracaId={atual?.id ?? null} nome={sessao?.nome ?? "Equipe"} pendentes={pendentes} />
      <main id="conteudo" className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-8 md:px-10 md:pb-16">
        {semConfiguracao ? (
          <p className="max-w-[40rem] text-paper">O acesso ainda não está configurado neste servidor.</p>
        ) : (
          <Entrada>{children}</Entrada>
        )}
      </main>
      <NavBase pendentes={pendentes} />
      {!preview && !semConfiguracao ? <EquipeAoVivo /> : null}
      </div>
    </div>
  );
}
