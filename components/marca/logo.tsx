import Image from "next/image";

const SRC = "/brand/logo-mirage.png";
const LARGURA = 1328;
const ALTURA = 508;

type Tamanho = "cabecalho" | "acesso" | "repouso";

const VISUAL: Record<
  Tamanho,
  { caixa: string; imagem: string; style: { width: string; height: string }; sizes: string }
> = {
  cabecalho: {
    caixa: "block h-9 w-[94px] shrink-0 md:h-11 md:w-[115px]",
    imagem: "block h-full w-full bg-transparent object-contain",
    style: { width: "100%", height: "100%" },
    sizes: "(max-width: 768px) 94px, 115px",
  },
  acesso: {
    caixa: "block w-full",
    imagem: "block h-auto w-full bg-transparent",
    style: { width: "100%", height: "auto" },
    sizes: "(max-width: 640px) 88vw, 24rem",
  },
  repouso: {
    caixa: "mx-auto block w-full max-w-72",
    imagem: "block h-auto w-full bg-transparent",
    style: { width: "100%", height: "auto" },
    sizes: "18rem",
  },
};

export function Logo({ tamanho = "cabecalho", preload = false }: { tamanho?: Tamanho; preload?: boolean }) {
  const visual = VISUAL[tamanho];

  return (
    <span className={`logo-brilho ${visual.caixa}`}>
      <Image
        src={SRC}
        alt="Mirage Circus"
        width={LARGURA}
        height={ALTURA}
        sizes={visual.sizes}
        quality={90}
        preload={preload}
        loading={preload ? undefined : "eager"}
        className={visual.imagem}
        style={visual.style}
      />
    </span>
  );
}
