import { AssistirPerfil } from "@/components/acesso/assistir-perfil";
import { MolduraAcesso } from "@/components/acesso/moldura";
import { Entrada } from "@/components/painel/entrada";
import { sair } from "@/lib/acoes";

const TEXTOS = {
  pendente: {
    titulo: "Aguardando aprovação",
    corpo: "Um membro da equipe precisa liberar o seu acesso. Quando isso acontecer, esta tela abre a grade.",
  },
  recusado: {
    titulo: "Acesso não liberado",
    corpo: "Seu acesso não foi liberado. Se for um engano, fale com a equipe. Se liberarem depois, esta tela abre a grade.",
  },
} as const;

export function TelaAcesso({ modo, usuarioId }: { modo: keyof typeof TEXTOS; usuarioId?: string }) {
  const texto = TEXTOS[modo];

  return (
    <MolduraAcesso>
      <div className="w-full">
        <Entrada>
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="font-display text-4xl text-gold">{texto.titulo}</h2>
            <p className="texto text-paper">{texto.corpo}</p>
            <form action={sair} className="w-full">
              <button type="submit" className="botao botao-cheio">
                Sair
              </button>
            </form>
          </div>
        </Entrada>
      </div>
      {usuarioId ? <AssistirPerfil id={usuarioId} /> : null}
    </MolduraAcesso>
  );
}
