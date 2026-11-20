import { Titulo } from "@/components/motion/titulo";
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
      <Titulo className="mb-12">Equipe</Titulo>
      <ListaEquipe key={chave} iniciais={membros} meuId={sessao?.id ?? ""} preview={previewAtivo()} />
    </div>
  );
}
