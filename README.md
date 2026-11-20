# Mirage

Grade interna do Mirage Circus. A pessoa cria a conta com e-mail e senha, ou entra numa conta que já existe. A primeira conta fica aprovada. As seguintes esperam alguém da equipe liberar o acesso, na página Equipe.

Quem está aprovado faz a mesma coisa: editar peças, subir mídia, comentar e cuidar das praças. A coluna `perfis.papel` existe com o padrão `equipe` e não autoriza nada. Quem autoriza é `perfis.status`.

## Rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem usuários no Supabase, a tela de login abre e a senha ainda não entra.

Para ver as telas com peças de exemplo, só na sua máquina:

```bash
MIRAGE_PREVIEW=1 npm run dev
```

A faixa dourada avisa que é prévia. Isso não existe em produção (`NODE_ENV=production` ignora a variável).

## Variáveis

| Nome | Onde | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador e servidor | chave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | só servidor | rotas de bot, Fase 2 |

A service role não pode ir para o navegador. Não use o prefixo `NEXT_PUBLIC_` nela e não commite um `.env` real. O arquivo que vai para o git é só `.env.example`.

Na Vercel, projeto Next.js padrão, as três variáveis ficam em Settings → Environment Variables. A service role pode esperar a Fase 2; sem ela, `POST /api/bots/pecas` responde 503.

## Migrations

Aplicar nesta ordem, no SQL editor do Supabase ou pelo MCP:

1. `supabase/migrations/20261118120000_esquema.sql`
2. `supabase/migrations/20261118120100_storage_realtime.sql`
3. `supabase/migrations/20261118120200_seed_exemplo.sql` (opcional)
4. `supabase/migrations/20261119145522_aprovacao_membros.sql`
5. `supabase/migrations/20261119235900_pecas_concluido.sql`

A terceira cria uma praça chamada Exemplo, inativa, sem datas e sem peças. Dá para pular. A quarta é a aprovação: sem ela, quem entra não passa da tela de espera. A quinta marca conclusão nas peças (`concluido`, `concluido_por`, `concluido_em`). Sem ela, o botão Concluir não grava. Bot não conclui: só uma pessoa aprovada.

O que isso prepara:

- Tabelas `perfis`, `pracas`, `semanas`, `pecas`, `midias`, `comentarios`, `historico`, `registro_bots`.
- Perfil criado no cadastro, com `papel = equipe`. O status nasce `aprovado` só se ainda não houver ninguém aprovado. Senão, `pendente`.
- Linhas de `perfis` que já existiam na hora da quarta migration ficam `aprovado`. Rodar o arquivo de novo não aprova quem chegou depois.
- RLS: anônimo não lê. `private.tem_perfil()` só é verdadeiro com `status = aprovado`. Pendente e recusado leem a própria linha de `perfis` (a tela de espera) e mais nada: praças, peças, mídia, comentários, histórico e o bucket `midias` ficam fechados.
- Status não muda por `UPDATE`. A página Equipe chama `public.aprovar_membro(id, novo_status)`. Quem chama precisa estar aprovado e não pode decidir o próprio acesso. A função grava `aprovado_por` e `aprovado_em`.
- `historico` só é lido; quem grava é o gatilho. `registro_bots` não tem policy (só a service role, que não passa por essa aprovação).
- Bucket privado `midias`, 50 MB por arquivo. Caminho `praca/semana/dia/peca/arquivo`.
- Realtime em `pecas`, `midias`, `comentarios` e `perfis`.

## Contas

Em Authentication → Providers → Email, deixe o cadastro público ligado. A tela `/login` tem Entrar e Criar conta. O controle de quem vê a grade é o status no banco, não o interruptor do Auth.

A primeira conta entra direto. As outras veem “Aguardando aprovação” até alguém aprovar em Equipe. Recusar mostra “Acesso não liberado”. As duas telas escutam o Realtime da própria linha e abrem a grade se o status mudar.

Na página Equipe, quem já está aprovado vê os pedidos (nome, e-mail, data de cadastro), aprova ou recusa, e vê quem já entrou. O número ao lado de Equipe é quantos estão pendentes. Dá para aprovar de novo alguém que foi recusado. Ninguém apaga perfil, e ninguém muda o próprio status.

Se a confirmação de e-mail estiver ligada no Auth, a pessoa confirma e só então entra com a senha. Com a confirmação desligada, a sessão abre na hora e cai na espera ou na grade.

O gatilho `criar_perfil_no_cadastro` cria a linha em `perfis`, com o nome pedido no cadastro. Para ajustar o nome de quem já entrou:

```sql
update public.perfis
   set nome = 'Nome'
 where id = 'uuid-do-usuario';
```

Não use `UPDATE` para mudar `status`. O gatilho recusa. O caminho é a página Equipe.

## Logo

A marca oficial é `public/brand/logo-mirage.png` (fundo preto, sem transparência). `components/marca/logo.tsx` mostra esse arquivo com `next/image`, em WebP ou AVIF, no tamanho da tela.

Os ícones do PWA estão em `public/icons/icon-192.png`, `public/icons/icon-512.png` e `public/apple-touch-icon.png`. O manifesto usa `purpose: any`.

## Mídia

Imagens JPG, PNG, WebP ou GIF. Vídeos MP4, MOV ou WebM. Acima de 50 MB o app avisa e não envia. A peça mostra a mídia marcada como final, por URL assinada.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
