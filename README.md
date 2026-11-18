# Mirage

Grade interna do Mirage Circus. Três pessoas da equipe entram com e-mail e senha, escolhem a praça e organizam o que vai ao ar. Não há cadastro público.

Todo mundo que tem perfil faz a mesma coisa: editar peças, subir mídia, comentar e cuidar das praças. A coluna `perfis.papel` existe com o padrão `equipe` e não autoriza nada.

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

A terceira cria uma praça chamada Exemplo, inativa, sem datas e sem peças. Dá para pular.

O que isso prepara:

- Tabelas `perfis`, `pracas`, `semanas`, `pecas`, `midias`, `comentarios`, `historico`, `registro_bots`.
- Perfil criado no cadastro, com `papel = equipe`.
- RLS: anônimo não lê. Quem está autenticado e tem perfil lê e escreve o app inteiro, inclusive praças. `historico` só é lido; quem grava é o gatilho. `registro_bots` não tem policy (só a service role).
- Bucket privado `midias`, 50 MB por arquivo. Caminho `praca/semana/dia/peca/arquivo`.
- Realtime em `pecas`, `midias` e `comentarios`.

## Criar as três pessoas

No Supabase: Authentication → Users → Add user. E-mail e senha, com confirmação automática. Repita para as três contas.

Em Authentication → Providers → Email, desligue o cadastro público. O app não tem tela de inscrição.

O gatilho `criar_perfil_no_cadastro` cria a linha em `perfis`. Para ajustar o nome:

```sql
update public.perfis
   set nome = 'Nome'
 where id = 'uuid-do-usuario';
```

Não há papel de admin. As três contas fazem o mesmo.

## Logo

Até o arquivo oficial chegar, a marca é a palavra MIRAGE. Coloque o arquivo em `public/logo.png` ou `public/logo.svg` e o componente `components/marca/logo.tsx` passa a usá-lo.

## Mídia

Imagens JPG, PNG, WebP ou GIF. Vídeos MP4, MOV ou WebM. Acima de 50 MB o app avisa e não envia. A peça mostra a mídia marcada como final, por URL assinada.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

Os ícones do PWA saem de `node scripts/gerar-icones.mjs`.
