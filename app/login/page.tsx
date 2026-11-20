import { MolduraAcesso } from "@/components/acesso/moldura";
import { FormularioLogin } from "@/components/login/formulario";

export const metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const next = query.next?.startsWith("/") && !query.next.startsWith("//") ? query.next : "/calendario";

  return (
    <MolduraAcesso animar>
      <p className="texto text-center text-paper">A grade de quem publica o circo.</p>
      <FormularioLogin next={next} />
    </MolduraAcesso>
  );
}
