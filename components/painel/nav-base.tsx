import { Navegacao } from "@/components/painel/navegacao";

export function NavBase({ pendentes }: { pendentes: number }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line-soft bg-ink md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Navegacao variante="base" pendentes={pendentes} />
    </div>
  );
}
