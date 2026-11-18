import Link from "next/link";
import { Moldura } from "@/components/marca/moldura";
import { horarioCurto } from "@/lib/datas";
import { ROTULO_PILAR, ROTULO_STATUS, ROTULO_TIPO } from "@/lib/rotulos";
import type { Midia, Peca } from "@/lib/tipos";

export type PecaDoDia = Peca & { midiaFinal: Midia | null };

export function ListaHoje({ pecas, temPraca }: { pecas: PecaDoDia[]; temPraca: boolean }) {
  if (!temPraca) {
    return (
      <p className="texto max-w-[42rem] text-paper">
        Nenhuma praça ainda.{" "}
        <Link href="/pracas" className="link">
          Criar a primeira
        </Link>
        .
      </p>
    );
  }

  if (pecas.length === 0) {
    return (
      <p className="texto max-w-[42rem] text-paper">
        Nada vai ao ar hoje nesta praça.{" "}
        <Link href="/grade" className="link">
          Abrir a grade
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="flex max-w-[42rem] flex-col">
      {pecas.map((peca) => (
        <li key={peca.id} className="border-t border-line-soft py-6">
          <Link href={`/pecas/${peca.id}`} className="grid grid-cols-[4.5rem_1fr] gap-4">
            <Miniatura peca={peca} />
            <span>
              <span className="font-display block text-2xl text-gold">{peca.titulo || "Sem título"}</span>
              <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-paper">
                {horarioCurto(peca.horario) ? <span className="num">{horarioCurto(peca.horario)}</span> : null}
                <span>{ROTULO_TIPO[peca.tipo]}</span>
                <span>{ROTULO_PILAR[peca.pilar]}</span>
              </span>
              <span className={peca.status === "pronto" || peca.status === "publicado" ? "mt-2 block text-gold" : "mt-2 block text-mist"}>
                {ROTULO_STATUS[peca.status]}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Miniatura({ peca }: { peca: PecaDoDia }) {
  const midia = peca.midiaFinal;
  if (midia?.url && midia.tipo === "imagem") {
    return (
      // URL assinada, curta, sem passar pelo otimizador.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={midia.url} alt="" className="h-[6.5rem] w-[4.5rem] object-cover" />
    );
  }
  if (midia?.url && midia.tipo === "video") {
    return <video src={midia.url} muted playsInline preload="metadata" className="h-[6.5rem] w-[4.5rem] object-cover" />;
  }
  return <Moldura className="h-[6.5rem] w-[4.5rem]" />;
}
