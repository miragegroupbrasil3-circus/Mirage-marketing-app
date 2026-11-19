-- Aprovação de membros.
-- O cadastro do Auth continua aberto. Quem entra no app é quem tem
-- perfis.status = 'aprovado'. A primeira conta (quando ninguém está
-- aprovado) nasce aprovada. As seguintes nascem pendentes.
-- Reaplicar este arquivo não promove pedidos que já chegaram:
-- o backfill só corre enquanto não existe nenhum aprovado.
--
-- Status, aprovado_por e aprovado_em não mudam por UPDATE direto.
-- O caminho é public.aprovar_membro, que grava quem decidiu e quando.
-- No SQL editor, se precisar corrigir à mão, na mesma transação:
--   select set_config('mirage.aprovando', 'on', true);
--   update public.perfis set status = 'aprovado' where id = '...';

lock table public.perfis in share row exclusive mode;

alter table public.perfis add column if not exists status text;
alter table public.perfis add column if not exists aprovado_por uuid;
alter table public.perfis add column if not exists aprovado_em timestamptz;
alter table public.perfis add column if not exists email text;

update public.perfis
   set status = 'pendente'
 where status is null;

alter table public.perfis alter column status set default 'pendente';
alter table public.perfis alter column status set not null;

-- E-mail copiado de auth.users para a lista da equipe.
-- Quem está pendente ou recusado só consegue ler a própria linha.
update public.perfis as perfil
   set email = nullif(left(btrim(usuario.email), 320), '')
  from auth.users as usuario
 where perfil.id = usuario.id
   and perfil.email is distinct from nullif(left(btrim(usuario.email), 320), '');

-- Linhas que já existiam entram aprovadas. O subquery enxerga o
-- começo do comando: se ninguém está aprovado, todas passam.
update public.perfis
   set status = 'aprovado'
 where not exists (
   select 1
   from public.perfis as ja
   where ja.status = 'aprovado'
 );

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'perfis_status_check') then
    alter table public.perfis
      add constraint perfis_status_check
      check (status in ('pendente', 'aprovado', 'recusado'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'perfis_aprovado_por_fkey') then
    alter table public.perfis
      add constraint perfis_aprovado_por_fkey
      foreign key (aprovado_por) references public.perfis (id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'perfis_nao_se_aprova') then
    alter table public.perfis
      add constraint perfis_nao_se_aprova
      check (aprovado_por is null or aprovado_por <> id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'perfis_email_tamanho') then
    alter table public.perfis
      add constraint perfis_email_tamanho
      check (email is null or char_length(email) <= 320);
  end if;
end $$;

comment on column public.perfis.status is
  'pendente espera decisão. aprovado entra no app. recusado fica de fora. Não autoriza pelo papel.';

comment on column public.perfis.aprovado_por is
  'Quem decidiu. Nulo na primeira conta e nas linhas promovidas por esta migration.';

comment on column public.perfis.aprovado_em is
  'Quando a última decisão foi gravada por aprovar_membro.';

comment on column public.perfis.email is
  'Cópia de auth.users.email para a página Equipe. Atualizada no cadastro e quando o e-mail muda.';

create index if not exists perfis_aprovado_por_idx on public.perfis (aprovado_por);
create index if not exists perfis_status_idx on public.perfis (status);

-- ---------------------------------------------------------------------------
-- Funções
-- ---------------------------------------------------------------------------

create or replace function private.tem_perfil()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis
    where id = (select auth.uid())
      and status = 'aprovado'
  );
$$;

create or replace function private.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_nome text;
  v_email text;
begin
  -- Serializa o primeiro acesso. Duas contas ao mesmo tempo não
  -- podem as duas se verem como a primeira.
  perform pg_advisory_xact_lock(872341001);

  if exists (select 1 from public.perfis where status = 'aprovado') then
    v_status := 'pendente';
  else
    v_status := 'aprovado';
  end if;

  -- O nome pode vir do metadata, que o usuário edita. O status, não.
  v_nome := coalesce(
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'nome', '')), 120), ''),
    nullif(left(split_part(coalesce(new.email, ''), '@', 1), 120), ''),
    'Equipe'
  );
  v_email := nullif(left(btrim(coalesce(new.email, '')), 320), '');

  insert into public.perfis (id, nome, email, status)
  values (new.id, v_nome, v_email, v_status)
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function private.sincronizar_email_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.perfis
       set email = nullif(left(btrim(coalesce(new.email, '')), 320), '')
     where id = new.id;
  end if;
  return new;
end;
$$;

-- Lê a linha já gravada e recusa o UPDATE se status, aprovado_por
-- ou aprovado_em vierem diferentes. SECURITY DEFINER para não depender
-- da policy de quem está gravando o próprio nome.
create or replace function private.colunas_de_acesso_intactas(
  perfil_id uuid,
  novo_status text,
  novo_por uuid,
  novo_em timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select current_setting('mirage.aprovando', true) is not distinct from 'on'
    or exists (
      select 1
      from public.perfis
      where id = perfil_id
        and status is not distinct from novo_status
        and aprovado_por is not distinct from novo_por
        and aprovado_em is not distinct from novo_em
    );
$$;

create or replace function private.proteger_status_perfil()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     or new.aprovado_por is distinct from old.aprovado_por
     or new.aprovado_em is distinct from old.aprovado_em then
    if current_setting('mirage.aprovando', true) is distinct from 'on' then
      raise exception 'O status do perfil só muda pela função aprovar_membro.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.aprovar_membro(membro_id uuid, novo_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  if v_caller is null then
    raise exception 'Entre de novo para continuar.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.perfis
    where id = v_caller
      and status = 'aprovado'
  ) then
    raise exception 'Só um membro aprovado pode decidir.'
      using errcode = '42501';
  end if;

  if membro_id is null or membro_id = v_caller then
    raise exception 'Você não pode alterar o próprio status.'
      using errcode = '42501';
  end if;

  if novo_status is null or novo_status not in ('pendente', 'aprovado', 'recusado') then
    raise exception 'Status inválido.'
      using errcode = '22023';
  end if;

  perform set_config('mirage.aprovando', 'on', true);

  update public.perfis
     set status = novo_status,
         aprovado_por = v_caller,
         aprovado_em = now()
   where id = membro_id;

  if not found then
    raise exception 'Membro não encontrado.'
      using errcode = 'P0002';
  end if;
end;
$$;

-- Invoker de propósito: o definer fica no schema private, fora da API.
create or replace function public.aprovar_membro(id uuid, novo_status text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.aprovar_membro(id, novo_status);
end;
$$;

comment on function public.aprovar_membro(uuid, text) is
  'Membro aprovado define o status de outro perfil. Grava aprovado_por e aprovado_em. Não altera o próprio.';

revoke all on function private.tem_perfil() from public, anon;
revoke all on function private.criar_perfil() from public, anon;
revoke all on function private.sincronizar_email_perfil() from public, anon;
revoke all on function private.colunas_de_acesso_intactas(uuid, text, uuid, timestamptz) from public, anon;
revoke all on function private.proteger_status_perfil() from public, anon;
revoke all on function private.aprovar_membro(uuid, text) from public, anon;
revoke all on function public.aprovar_membro(uuid, text) from public, anon, authenticated;

grant execute on function private.tem_perfil() to authenticated;
grant execute on function private.colunas_de_acesso_intactas(uuid, text, uuid, timestamptz) to authenticated;
grant execute on function private.proteger_status_perfil() to authenticated;
grant execute on function private.aprovar_membro(uuid, text) to authenticated;
grant execute on function public.aprovar_membro(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Gatilhos
-- ---------------------------------------------------------------------------

drop trigger if exists sincronizar_email_perfil on auth.users;
create trigger sincronizar_email_perfil
  after update of email on auth.users
  for each row execute function private.sincronizar_email_perfil();

drop trigger if exists perfis_proteger_status on public.perfis;
create trigger perfis_proteger_status
  before update of status, aprovado_por, aprovado_em on public.perfis
  for each row execute function private.proteger_status_perfil();

-- ---------------------------------------------------------------------------
-- Privilégios e RLS
-- Anônimo continua sem acesso. Pendente e recusado leem só o próprio perfil,
-- para a tela de espera. O restante do app segue private.tem_perfil(),
-- agora verdadeiro só para status aprovado. Não há delete de perfil.
-- ---------------------------------------------------------------------------

revoke all on public.perfis from anon, authenticated;
grant select, update (nome, avatar_path) on public.perfis to authenticated;

drop policy if exists perfis_le on public.perfis;
drop policy if exists perfis_atualiza on public.perfis;
drop policy if exists perfis_le_proprio on public.perfis;
drop policy if exists perfis_le_equipe on public.perfis;

create policy perfis_le_proprio on public.perfis
  for select to authenticated
  using ((select auth.uid()) = id);

create policy perfis_le_equipe on public.perfis
  for select to authenticated
  using ((select private.tem_perfil()));

create policy perfis_atualiza on public.perfis
  for update to authenticated
  using ((select private.tem_perfil()))
  with check (
    (select private.tem_perfil())
    and (select private.colunas_de_acesso_intactas(id, status, aprovado_por, aprovado_em))
  );

-- ---------------------------------------------------------------------------
-- Realtime: a tela de espera escuta a própria linha.
-- ---------------------------------------------------------------------------

alter table public.perfis replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.perfis;
exception
  when duplicate_object then
    null;
  when undefined_object then
    raise notice 'Publicação supabase_realtime ausente. Ative o Realtime no projeto.';
end $$;
