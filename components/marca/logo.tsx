import fs from "node:fs";
import path from "node:path";

type Props = {
  className?: string;
};

/**
 * Enquanto o arquivo oficial não chega, a marca é a palavra MIRAGE.
 * Coloque o arquivo em public/logo.png ou public/logo.svg para substituí-la.
 */
export function Logo({ className = "" }: Props) {
  const png = path.join(process.cwd(), "public", "logo.png");
  const svg = path.join(process.cwd(), "public", "logo.svg");
  const arquivo = fs.existsSync(png) ? "/logo.png" : fs.existsSync(svg) ? "/logo.svg" : null;

  if (arquivo) {
    return (
      // O arquivo pode ser SVG; next/image não cobre esse slot sem configuração extra.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={arquivo} alt="Mirage" className={`h-[0.72em] w-auto ${className}`} />
    );
  }

  return <span className={`font-display leading-none tracking-[-0.03em] text-gold ${className}`}>MIRAGE</span>;
}
