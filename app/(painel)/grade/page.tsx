import Link from "next/link";
import { Quadro } from "@/components/grade/quadro";
import { listarPracas, pecasNoIntervalo, pracaAtiva } from "@/lib/consultas";
import { diasDaSemana, hojeISO, rotuloSemana, segundaDaSemana, somarDias } from "@/lib/datas";
import { previewAtivo } from "@/lib/preview";
import { cx } from "@/lib/cx";

export const dynamic = "force-dynamic";

export const metadata = { title: "Grade" };

export default async function PaginaGrade({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; visao?: string; dia?: string }>;
}) {
  const query = await searchParams;
  const hoje = hojeISO();
  const pedida = query.semana && /^\d{4}-\d{2}-\d{2}$/.test(query.semana) ? query.semana : hoje;
  const segunda = segundaDaSemana(pedida);
  const dias = diasDaSemana(segunda);
  const visao = query.visao === "status" ? "status" : "dia";
  const pracas = await listarPracas();
  const praca = await pracaAtiva(pracas);
  const pecas = praca ? await pecasNoIntervalo(praca.id, segunda, dias[6]) : [];
  const dia = query.dia && dias.includes(query.dia) ? query.dia : dias.includes(hoje) ? hoje : segunda;
  const anterior = `/grade?semana=${somarDias(segunda, -7)}&visao=${visao}`;
  const proxima = `/grade?semana=${somarDias(segunda, 7)}&visao=${visao}`;
  const diaAntes = somarDias(dia, -1);
  const diaDepois = somarDias(dia, 1);

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-gold sm:text-6xl">Grade</h1>
          <p className="mt-3 text-paper">{rotuloSemana(segunda)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={anterior} className="inline-flex min-h-11 items-center text-paper">
            Semana anterior
          </Link>
          <Link href={proxima} className="inline-flex min-h-11 items-center text-paper">
            Próxima semana
          </Link>
          <Link href={`/grade?semana=${segunda}&visao=dia`} className={cx("inline-flex min-h-11 items-center", visao === "dia" ? "text-gold" : "text-mist")} aria-current={visao === "dia" ? "page" : undefined}>
            Por dia
          </Link>
          <Link href={`/grade?semana=${segunda}&visao=status`} className={cx("inline-flex min-h-11 items-center", visao === "status" ? "text-gold" : "text-mist")} aria-current={visao === "status" ? "page" : undefined}>
            Por estado
          </Link>
        </div>
      </div>
      <div className="mt-10">
        {praca ? (
          <>
            {visao === "dia" ? (
            <div className="mb-6 flex justify-between md:hidden">
              <Link href={`/grade?semana=${segundaDaSemana(diaAntes)}&visao=dia&dia=${diaAntes}`} className="inline-flex min-h-11 items-center text-paper">
                Dia anterior
              </Link>
              <Link href={`/grade?semana=${segundaDaSemana(diaDepois)}&visao=dia&dia=${diaDepois}`} className="inline-flex min-h-11 items-center text-paper">
                Próximo dia
              </Link>
            </div>
            ) : null}
            <Quadro iniciais={pecas} dias={dias} visao={visao} pracaId={praca.id} preview={previewAtivo()} foco={dia} />
          </>
        ) : (
          <p className="text-paper">
            Nenhuma praça ainda.{" "}
            <Link href="/pracas" className="link">
              Criar a primeira
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
