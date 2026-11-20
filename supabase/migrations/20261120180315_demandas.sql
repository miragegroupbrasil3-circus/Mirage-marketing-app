-- Demandas da equipe por praça: flyer, story, arte, vídeo ou outro.
-- Membro aprovado lê e escreve via private.tem_perfil().
-- concluido_em só muda no gatilho, quando o status entra ou sai de feito.

create table if not exists public.demandas (
  id uuid primary key default gen_random_uuid(),
  praca_id uuid not null references public.pracas (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  descricao text,
  prazo date,
  responsavel_id uuid references public.perfis (id) on delete set null,
  status text not null default 'a_fazer',
  criado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  concluido_em timestamptz,
  constraint demandas_tipo_check check (tipo in ('flyer', 'story', 'arte_feed', 'video', 'outro')),
  constraint demandas_status_check check (status in ('a_fazer', 'fazendo', 'feito')),
  constraint demandas_titulo_tamanho check (char_length(btrim(titulo)) between 1 and 180),
  constraint demandas_descricao_tamanho check (descricao is null or char_length(descricao) <= 4000)
);

comment on table public.demandas is
  'Pedidos da equipe numa praça. Não entram na contagem de peças.';

comment on column public.demandas.concluido_em is
  'Preenchido pelo gatilho quando o status passa a feito. Nulo nos demais.';

-- (praca_id, status) cobre o filtro da lista e o cascade da praça.
create index if not exists demandas_praca_status_idx on public.demandas (praca_id, status);
create index if not exists demandas_praca_prazo_idx on public.demandas (praca_id, prazo) where prazo is not null;
create index if not exists demandas_responsavel_id_idx on public.demandas (responsavel_id);
create index if not exists demandas_criado_por_idx on public.demandas (criado_por);

create or replace function private.tocar_demanda()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.titulo := btrim(new.titulo);
  if new.descricao is not null then
    new.descricao := nullif(btrim(new.descricao), '');
  end if;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.criado_por := (select auth.uid());
  end if;

  new.atualizado_em := now();

  if tg_op = 'INSERT' then
    if new.status = 'feito' then
      new.concluido_em := now();
    else
      new.concluido_em := null;
    end if;
  elsif new.status = 'feito' and old.status is distinct from 'feito' then
    new.concluido_em := now();
  elsif new.status is distinct from 'feito' then
    new.concluido_em := null;
  else
    new.concluido_em := old.concluido_em;
  end if;

  return new;
end;
$$;

revoke all on function private.tocar_demanda() from public, anon;
grant execute on function private.tocar_demanda() to authenticated;

drop trigger if exists demandas_tocar on public.demandas;
create trigger demandas_tocar
  before insert or update on public.demandas
  for each row execute function private.tocar_demanda();

revoke all on public.demandas from anon, authenticated;
grant select, insert, update, delete on public.demandas to authenticated;

alter table public.demandas enable row level security;

drop policy if exists demandas_equipe on public.demandas;
create policy demandas_equipe on public.demandas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

alter table public.demandas replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.demandas;
exception
  when duplicate_object then
    null;
  when undefined_object then
    raise notice 'Publicação supabase_realtime ausente. Ative o Realtime no projeto.';
end $$;
