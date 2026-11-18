import { PainelPracas } from "@/components/pracas/painel";
import { listarPracas } from "@/lib/consultas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Praças" };

export default async function PaginaPracas() {
  const pracas = await listarPracas();
  return (
    <div>
      <h1 className="font-display mb-12 text-5xl text-gold sm:text-6xl">Praças</h1>
      <PainelPracas iniciais={pracas} preview={previewAtivo()} />
    </div>
  );
}
