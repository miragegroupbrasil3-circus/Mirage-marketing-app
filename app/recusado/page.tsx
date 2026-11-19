import { redirect } from "next/navigation";
import { TelaAcesso } from "@/components/acesso/tela";
import { obterSessao } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Acesso não liberado" };

export default async function PaginaRecusado() {
  if (previewAtivo()) return <TelaAcesso modo="recusado" />;

  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (sessao.status === "aprovado") redirect("/hoje");
  if (sessao.status === "pendente") redirect("/aguardando");

  return <TelaAcesso modo="recusado" usuarioId={sessao.id} />;
}
