import { ListaHoje } from "@/components/hoje/lista";
import { listarPracas, pecasNoIntervalo, pracaAtiva } from "@/lib/consultas";
import { hojeISO, rotuloData } from "@/lib/datas";

export const dynamic = "force-dynamic";

export const metadata = { title: "Hoje" };

export default async function PaginaHoje() {
  const pracas = await listarPracas();
  const praca = await pracaAtiva(pracas);
  const hoje = hojeISO();
  const pecas = praca ? await pecasNoIntervalo(praca.id, hoje, hoje) : [];
  const ordenadas = [...pecas].sort(
    (a, b) => (a.horario ?? "99:99").localeCompare(b.horario ?? "99:99") || a.ordem - b.ordem,
  );

  return (
    <div>
      <h1 className="font-display text-5xl text-gold sm:text-6xl">Hoje</h1>
      <p className="mt-3 text-paper">{rotuloData(hoje)}</p>
      {praca ? <p className="mt-2 text-mist">{praca.cidade}</p> : null}
      <div className="mt-12">
        <ListaHoje pecas={ordenadas} temPraca={Boolean(praca)} />
      </div>
    </div>
  );
}
