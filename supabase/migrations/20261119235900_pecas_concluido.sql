-- Conclusão de peça.
-- Só uma pessoa autenticada marca concluido. O gatilho grava quem e quando.
-- Bot (service role, auth.uid() nulo) não altera estes campos: a peça nasce
-- em aberto e um UPDATE do bot não fecha nem reabre.
-- Não apaga coluna nem dado. RLS continua em private.tem_perfil().

alter table public.pecas
  add column if not exists concluido boolean not null default false;

alter table public.pecas
  add column if not exists concluido_por uuid;

alter table public.pecas
  add column if not exists concluido_em timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pecas_concluido_por_fkey') then
    alter table public.pecas
      add constraint pecas_concluido_por_fkey
      foreign key (concluido_por) references public.perfis (id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pecas_conclusao_coerente') then
    alter table public.pecas
      add constraint pecas_conclusao_coerente
      check (
        (concluido = false and concluido_por is null and concluido_em is null)
        or (concluido = true and concluido_em is not null)
      );
  end if;
end $$;

comment on column public.pecas.concluido is
  'Fechada por uma pessoa da equipe. Bots não gravam este campo.';

comment on column public.pecas.concluido_por is
  'Quem marcou concluido. O gatilho grava auth.uid(). Nulo se o perfil for apagado.';

comment on column public.pecas.concluido_em is
  'Quando a peça foi marcada como concluída. Nulo enquanto está em aberto.';

-- Consultas da grade e do progresso: praça + data, e quem concluiu.
create index if not exists pecas_praca_data_concluido_idx
  on public.pecas (praca_id, data, concluido);

create index if not exists pecas_concluido_por_idx
  on public.pecas (concluido_por);

create index if not exists pecas_concluido_em_idx
  on public.pecas (concluido_em)
  where concluido;

-- ---------------------------------------------------------------------------
-- Quem conclui é sempre a pessoa da sessão. Service role não mexe.
-- ---------------------------------------------------------------------------

create or replace function private.guardar_conclusao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    if tg_op = 'INSERT' then
      new.concluido := false;
      new.concluido_por := null;
      new.concluido_em := null;
    else
      new.concluido := old.concluido;
      new.concluido_por := old.concluido_por;
      new.concluido_em := old.concluido_em;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.concluido is not distinct from old.concluido then
    new.concluido_por := old.concluido_por;
    new.concluido_em := old.concluido_em;
    return new;
  end if;

  if new.concluido then
    new.concluido_por := (select auth.uid());
    new.concluido_em := now();
  else
    new.concluido := false;
    new.concluido_por := null;
    new.concluido_em := null;
  end if;

  return new;
end;
$$;

revoke all on function private.guardar_conclusao() from public, anon;
grant execute on function private.guardar_conclusao() to authenticated;

drop trigger if exists pecas_conclusao on public.pecas;
create trigger pecas_conclusao
  before insert or update on public.pecas
  for each row execute function private.guardar_conclusao();

-- A policy da peça não muda: quem tem perfil aprovado lê e escreve.
-- private.tem_perfil() continua sendo o único teste.
drop policy if exists pecas_equipe on public.pecas;
create policy pecas_equipe on public.pecas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));
