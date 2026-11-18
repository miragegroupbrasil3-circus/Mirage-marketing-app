# API dos bots (Fase 2)

Rascunho do contrato. A rota já existe e responde, mas só funciona depois que `SUPABASE_SERVICE_ROLE_KEY` estiver no servidor e houver uma linha em `registro_bots`.

A chave do bot nunca vai para o navegador. O app guarda só o SHA-256 em hexadecimal (UTF-8) na coluna `chave_hash`.

## Autenticação

Cada bot tem a sua chave. Envie:

```
Authorization: Bearer <chave>
```

A rota calcula o hash e procura um registro ativo. Chave ausente ou recusada responde `401`. Sem a service role no servidor, responde `503`.

Criar um bot (rode no SQL editor, com uma chave que você mesmo gerou):

```sql
insert into public.registro_bots (nome, descricao, chave_hash)
values (
  'roteiros',
  'Cria peças a partir do banco de pautas.',
  encode(extensions.digest('cole-a-chave-aqui', 'sha256'), 'hex')
);
```

O mesmo hash em Node:

```js
crypto.createHash("sha256").update("cole-a-chave-aqui").digest("hex");
```

Não reutilize essa frase como chave real.

## POST /api/bots/pecas

Cria uma peça na praça indicada. Quem grava é o service role, no servidor. O histórico de autoria fica vazio quando não há usuário humano.

### Corpo

```json
{
  "praca_id": "uuid-da-praca",
  "data": "2026-11-20",
  "horario": "18:00",
  "tipo": "reels",
  "titulo": "Olha onde a moto vai passar.",
  "legenda": "",
  "cta": null,
  "pilar": "espetaculo",
  "status": "ideia"
}
```

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `praca_id` | sim | uuid de `pracas` |
| `data` | sim | `AAAA-MM-DD` |
| `horario` | não | `HH:MM` |
| `tipo` | não | `reels`, `carrossel`, `estatico`, `stories`. Padrão: `reels` |
| `titulo` | não | até 180 caracteres |
| `legenda` | não | até 5000 caracteres |
| `cta` | não | até 280 caracteres |
| `pilar` | não | `espetaculo`, `estrutura`, `vida_no_circo`, `publico`. Padrão: `espetaculo` |
| `status` | não | `ideia`, `em_producao`, `pronto`, `publicado`. Padrão: `ideia` |

A semana é criada pelo gatilho, a partir da data. O `slug` do caminho de mídia é gerado na rota.

### Respostas

`201`

```json
{ "id": "uuid-da-peca" }
```

`400` corpo inválido ou a praça não existe.

`401` chave ausente ou recusada.

`503` falta `SUPABASE_SERVICE_ROLE_KEY`.

Erros vêm como `{ "erro": "mensagem em português" }`.

## O que fica para a Fase 2

- Upload de mídia pelo bot, no mesmo caminho `praca/semana/dia/peca/arquivo`.
- Uma chave por bot, rotação e desativação (`ativo = false`).
- Limite de uso, se a operação pedir.
- Não expor esta rota no menu. Ela não usa a sessão de quem está logado no app.
