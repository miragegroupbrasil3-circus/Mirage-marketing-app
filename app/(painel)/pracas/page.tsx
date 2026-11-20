import { Titulo } from "@/components/motion/titulo";
import { PainelPracas } from "@/components/pracas/painel";
import { listarPracas } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Praças" };

export default async function PaginaPracas() {
  const pracas = await listarPracas();
  return (
    <div>
      <Titulo className="mb-12">Praças</Titulo>
      <PainelPracas iniciais={pracas} preview={previewAtivo()} />
    </div>
  );
}
