import { Titulo } from "@/components/motion/titulo";
import { PainelPracas } from "@/components/pracas/painel";
import { listarMarcos, listarPracas } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Praças" };

export default async function PaginaPracas() {
  const [pracas, marcos] = await Promise.all([listarPracas(), listarMarcos()]);
  return (
    <div>
      <Titulo className="mb-12">Praças</Titulo>
      <PainelPracas iniciais={pracas} preview={previewAtivo()} marcos={marcos} />
    </div>
  );
}
