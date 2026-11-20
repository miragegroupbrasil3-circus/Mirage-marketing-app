import Link from "next/link";
import { Graficos } from "@/components/metricas/graficos";
import { Inclinavel } from "@/components/motion/inclinavel";
import { Titulo } from "@/components/motion/titulo";
import { AnelProgresso } from "@/components/progresso/anel";
import { FaixaProgresso } from "@/components/progresso/faixa";
import { listarMembros, listarPracas, listarResumo, pracaAtiva } from "@/lib/consultas";
import { diasDaSemana, fimMes, hojeISO, inicioMes, mesDe, segundaDaSemana } from "@/lib/datas";
import { previewAtivo } from "@/lib/preview";
import { contagem, noIntervalo, porFormato, porPessoa, porSemana, porStatus, sequenciaDias } from "@/lib/progresso";
import { Contador } from "@/components/motion/contador";

export const dynamic = "force-dynamic";

export const metadata = { title: "Métricas" };

export default async function PaginaMetricas() {
  const hoje = hojeISO();
  const pracas = await listarPracas();
  const praca = await pracaAtiva(pracas);
  const preview = previewAtivo();

  if (!praca) {
    return (
      <div>
        <Titulo>Métricas</Titulo>
        <p className="texto mt-6 text-paper">
          Nenhuma praça ainda.{" "}
          <Link href="/pracas" className="link">
            Criar a primeira
          </Link>
          .
        </p>
      </div>
    );
  }

  const [resumo, membros] = await Promise.all([listarResumo(praca.id), listarMembros()]);
  const nomes = new Map(membros.map((membro) => [membro.id, membro.nome]));
  const semana = diasDaSemana(segundaDaSemana(hoje));
  const daSemana = contagem(noIntervalo(resumo, semana[0], semana[6]));
  const doMes = contagem(noIntervalo(resumo, inicioMes(mesDe(hoje)), fimMes(mesDe(hoje))));
  const daPraca = contagem(resumo);
  const sequencia = sequenciaDias(resumo, hoje);
  const pessoas = porPessoa(resumo, nomes);

  return (
    <div>
      <Titulo>Métricas</Titulo>
      <p className="texto mt-3 max-w-2xl text-paper">
        Progresso da equipe em {praca.cidade}, contado nas peças gravadas. Nada aqui é estimativa.
      </p>
      {preview ? <p className="mt-2 text-sm text-gold">Prévia: estes números saem das peças de exemplo.</p> : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-[auto_1fr_16rem]">
        <Inclinavel className="cartao-circo rounded-3xl p-4">
          <AnelProgresso feitas={daSemana.feitas} total={daSemana.total} rotulo="Esta semana" />
        </Inclinavel>
        <Inclinavel className="cartao-circo flex flex-col justify-center gap-4 rounded-3xl p-4">
          <FaixaProgresso feitas={doMes.feitas} total={doMes.total} rotulo="Este mês" />
          <FaixaProgresso feitas={daPraca.feitas} total={daPraca.total} rotulo="Nesta praça" />
        </Inclinavel>
        <Inclinavel className="cartao-circo rounded-3xl p-4">
          <p className="text-sm text-mist">Sequência</p>
          {sequencia === 0 ? (
            <p className="texto mt-2 text-sm text-paper">A sequência começa no dia em que todas as peças ficam concluídas.</p>
          ) : (
            <p className="font-display mt-1 text-4xl text-gold">
              <Contador valor={sequencia} /> <span className="text-lg text-paper">dias</span>
            </p>
          )}
        </Inclinavel>
      </div>

      <Graficos semanas={porSemana(resumo)} formatos={porFormato(resumo)} estados={porStatus(resumo)} pessoas={pessoas} />

      <section className="cartao-circo mt-4 rounded-3xl p-6 md:p-10">
        <p className="text-sm uppercase tracking-[0.18em] text-turquoise">Instagram</p>
        <h2 className="font-display mt-2 text-3xl text-gold">@miragecircusbrasil</h2>
        <p className="texto mt-4 max-w-xl text-paper">
          As métricas do @miragecircusbrasil aparecem aqui quando o Mirage Insights começar a enviar dados.
        </p>
      </section>
    </div>
  );
}
