import { ListaEquipe } from "@/components/equipe/lista";
import { listarMembros, obterSessao } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Equipe" };

export default async function PaginaEquipe() {
  const [membros, sessao] = await Promise.all([listarMembros(), obterSessao()]);
  const chave = membros.map((membro) => `${membro.id}:${membro.status}`).join("|");

  return (
    <div>
      <h1 className="font-display mb-12 text-5xl text-gold sm:text-6xl">Equipe</h1>
      <ListaEquipe key={chave} iniciais={membros} meuId={sessao?.id ?? ""} preview={previewAtivo()} />
    </div>
  );
}
