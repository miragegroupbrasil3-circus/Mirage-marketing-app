import { notFound } from "next/navigation";
import { EditorPeca } from "@/components/peca/editor";
import { listarComentarios, listarHistorico, listarMidias, listarPracas, obterPeca, obterSessao } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const peca = await obterPeca(id);
  return { title: peca?.titulo || "Peça" };
}

export default async function PaginaPeca({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const peca = await obterPeca(id);
  if (!peca) notFound();

  const [midias, comentarios, historico, pracas, sessao] = await Promise.all([
    listarMidias(peca.id),
    listarComentarios(peca.id),
    listarHistorico(peca.id),
    listarPracas(),
    obterSessao(),
  ]);
  const praca = pracas.find((item) => item.id === peca.praca_id);

  return (
    <EditorPeca
      peca={peca}
      midias={midias}
      comentarios={comentarios}
      historico={historico}
      preview={previewAtivo()}
      pracaSlug={praca?.slug ?? "praca"}
      autorNome={sessao?.nome ?? "Equipe"}
    />
  );
}
