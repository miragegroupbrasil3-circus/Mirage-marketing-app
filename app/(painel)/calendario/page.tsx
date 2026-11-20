import Link from "next/link";
import { PainelCalendario } from "@/components/calendario/painel";
import { Titulo } from "@/components/motion/titulo";
import { listarMembros, listarResumo, obterSessao, pecasNoIntervalo, pracaAtiva, listarPracas } from "@/lib/consultas";
import { gradeDoMes, hojeISO, mesDe } from "@/lib/datas";
import { previewAtivo } from "@/lib/preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Calendário" };

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>;
}) {
  const query = await searchParams;
  const hoje = hojeISO();
  const mes = query.mes && /^\d{4}-\d{2}$/.test(query.mes) ? query.mes : mesDe(hoje);
  const grade = gradeDoMes(mes);
  const dia = query.dia && /^\d{4}-\d{2}-\d{2}$/.test(query.dia) ? query.dia : null;
  const pracas = await listarPracas();
  const praca = await pracaAtiva(pracas);

  if (!praca) {
    return (
      <div>
        <Titulo>Calendário</Titulo>
        <p className="texto mt-6 max-w-xl text-paper">
          Nenhuma praça ainda.{" "}
          <Link href="/pracas" className="link">
            Criar a primeira
          </Link>
          .
        </p>
      </div>
    );
  }

  const [pecas, resumo, membros, sessao] = await Promise.all([
    pecasNoIntervalo(praca.id, grade[0], grade[grade.length - 1], true),
    listarResumo(praca.id),
    listarMembros(),
    obterSessao(),
  ]);

  return (
    <PainelCalendario
      mes={mes}
      diaInicial={dia}
      pecas={pecas}
      resumo={resumo}
      hoje={hoje}
      pracaId={praca.id}
      preview={previewAtivo()}
      autorNome={sessao?.nome ?? "Equipe"}
      autorId={sessao?.id ?? ""}
      membros={membros.map((membro) => ({ id: membro.id, nome: membro.nome }))}
      cidade={praca.cidade}
    />
  );
}
