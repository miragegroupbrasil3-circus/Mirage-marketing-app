import { redirect } from "next/navigation";
import { TelaAcesso } from "@/components/acesso/tela";
import { obterSessao } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aguardando aprovação" };

export default async function PaginaAguardando() {
  if (previewAtivo()) return <TelaAcesso modo="pendente" />;

  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.status === "aprovado") redirect("/hoje");
  if (sessao.status === "recusado") redirect("/recusado");

  return <TelaAcesso modo="pendente" usuarioId={sessao.id} />;
}
