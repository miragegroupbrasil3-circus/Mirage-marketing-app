-- Mirage Circus · Fase 1
-- Esquema, índices, gatilhos e RLS.
-- Idempotente o bastante para reaplicar no SQL editor do Supabase.
-- Acesso: qualquer usuário autenticado que tenha perfil faz tudo.
-- A coluna perfis.papel existe com um único valor padrão e não autoriza nada.

create schema if not exists private;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------

create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  papel text not null default 'equipe',
  avatar_path text,
  criado_em timestamptz not null default now(),
  constraint perfis_nome_tamanho check (char_length(nome) between 1 and 120),
  constraint perfis_papel_tamanho check (char_length(papel) between 1 and 40)
);

comment on column public.perfis.papel is
  'Reservado. A Fase 1 não usa este campo para autorizar. O padrão é equipe.';

-- ---------------------------------------------------------------------------
-- Praças, semanas, peças
-- ---------------------------------------------------------------------------

create table if not exists public.pracas (
  id uuid primary key default gen_random_uuid(),
  cidade text not null,
  slug text not null,
  temporada text,
  inicio date,
  fim date,
  ativa boolean not null default true,
  e_exemplo boolean not null default false,
  criado_em timestamptz not null default now(),
  constraint pracas_slug_unica unique (slug),
  constraint pracas_cidade_tamanho check (char_length(cidade) between 1 and 120),
  constraint pracas_slug_formato check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint pracas_temporada_tamanho check (temporada is null or char_length(temporada) <= 160),
  constraint pracas_periodo check (inicio is null or fim is null or fim >= inicio)
);

create table if not exists public.semanas (
  id uuid primary key default gen_random_uuid(),
  praca_id uuid not null references public.pracas (id) on delete cascade,
  inicio date not null,
  constraint semanas_praca_inicio_unica unique (praca_id, inicio)
);

create table if not exists public.pecas (
  id uuid primary key default gen_random_uuid(),
  praca_id uuid not null references public.pracas (id) on delete cascade,
  semana_id uuid references public.semanas (id) on delete set null,
  data date not null,
  horario time,
  tipo text not null,
  titulo text not null default '',
  legenda text not null default '',
  cta text,
  pilar text not null,
  status text not null default 'ideia',
  ordem integer not null default 0,
  slug text not null,
  criado_por uuid references public.perfis (id) on delete set null,
  atualizado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint pecas_tipo_check check (tipo in ('reels', 'carrossel', 'estatico', 'stories')),
  constraint pecas_pilar_check check (pilar in ('espetaculo', 'estrutura', 'vida_no_circo', 'publico')),
  constraint pecas_status_check check (status in ('ideia', 'em_producao', 'pronto', 'publicado')),
  constraint pecas_titulo_tamanho check (char_length(titulo) <= 180),
  constraint pecas_legenda_tamanho check (char_length(legenda) <= 5000),
  constraint pecas_cta_tamanho check (cta is null or char_length(cta) <= 280),
  constraint pecas_slug_formato check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint pecas_slug_unica unique (praca_id, data, slug)
);

create table if not exists public.midias (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas (id) on delete cascade,
  storage_path text not null,
  tipo text not null,
  versao integer not null default 1,
  e_final boolean not null default false,
  largura integer,
  altura integer,
  duracao_segundos numeric(8, 2),
  nome_arquivo text not null,
  mime text,
  bytes bigint,
  criado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint midias_tipo_check check (tipo in ('imagem', 'video')),
  constraint midias_versao_positiva check (versao >= 1),
  constraint midias_medidas_positivas check (
    (largura is null or largura > 0)
    and (altura is null or altura > 0)
    and (duracao_segundos is null or duracao_segundos >= 0)
    and (bytes is null or bytes >= 0)
  ),
  constraint midias_caminho_unico unique (peca_id, storage_path)
);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas (id) on delete cascade,
  autor_id uuid references public.perfis (id) on delete set null,
  texto text not null,
  criado_em timestamptz not null default now(),
  constraint comentarios_texto_tamanho check (char_length(texto) between 1 and 4000)
);

create table if not exists public.historico (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas (id) on delete cascade,
  autor_id uuid references public.perfis (id) on delete set null,
  campo text not null,
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);

-- Fase 2. Sem policy: só o service role (que ignora RLS) escreve aqui.
create table if not exists public.registro_bots (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  chave_hash text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  ultimo_uso_em timestamptz,
  constraint registro_bots_nome_tamanho check (char_length(nome) between 1 and 80),
  constraint registro_bots_chave_unica unique (chave_hash)
);

comment on table public.registro_bots is
  'Chaves de bot guardadas só como hash SHA-256 em hexadecimal. Nunca grave a chave em claro.';

-- ---------------------------------------------------------------------------
-- Índices (FKs e a grade por praça + data)
-- ---------------------------------------------------------------------------

create index if not exists pecas_praca_data_idx on public.pecas (praca_id, data, ordem);
create index if not exists pecas_semana_id_idx on public.pecas (semana_id);
create index if not exists pecas_criado_por_idx on public.pecas (criado_por);
create index if not exists pecas_atualizado_por_idx on public.pecas (atualizado_por);
create index if not exists midias_peca_id_idx on public.midias (peca_id);
create index if not exists midias_criado_por_idx on public.midias (criado_por);
create unique index if not exists midias_uma_final_idx on public.midias (peca_id) where e_final;
create index if not exists comentarios_peca_id_idx on public.comentarios (peca_id, criado_em);
create index if not exists comentarios_autor_id_idx on public.comentarios (autor_id);
create index if not exists historico_peca_id_idx on public.historico (peca_id, criado_em desc);
create index if not exists historico_autor_id_idx on public.historico (autor_id);

-- ---------------------------------------------------------------------------
-- Funções (schema private: fora da API do PostgREST)
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
  );
$$;

create or replace function private.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Equipe'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.tocar_peca()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.criado_por := (select auth.uid());
  end if;
  new.atualizado_em := now();
  if (select auth.uid()) is not null then
    new.atualizado_por := (select auth.uid());
  end if;
  return new;
end;
$$;

create or replace function private.definir_semana_peca()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inicio date;
  v_id uuid;
begin
  v_inicio := date_trunc('week', new.data::timestamp)::date;

  insert into public.semanas (praca_id, inicio)
  values (new.praca_id, v_inicio)
  on conflict (praca_id, inicio) do nothing;

  select id
    into v_id
  from public.semanas
  where praca_id = new.praca_id
    and inicio = v_inicio;

  new.semana_id := v_id;
  return new;
end;
$$;

create or replace function private.registrar_historico_peca()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  antigo jsonb := to_jsonb(old);
  novo jsonb := to_jsonb(new);
  chave text;
begin
  for chave in select jsonb_object_keys(novo)
  loop
    if chave in ('id', 'criado_em', 'criado_por', 'atualizado_em', 'atualizado_por', 'semana_id') then
      continue;
    end if;
    if antigo -> chave is distinct from novo -> chave then
      insert into public.historico (peca_id, autor_id, campo, antes, depois)
      values (new.id, (select auth.uid()), chave, antigo -> chave, novo -> chave);
    end if;
  end loop;
  return new;
end;
$$;

create or replace function private.marcar_autor_comentario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.autor_id := (select auth.uid());
  end if;
  return new;
end;
$$;

create or replace function private.marcar_autor_midia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.criado_por := (select auth.uid());
  end if;
  return new;
end;
$$;

-- Antes de gravar a final, desmarca as outras da mesma peça.
create or replace function private.garantir_midia_final()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.e_final then
    update public.midias
       set e_final = false
     where peca_id = new.peca_id
       and id is distinct from new.id
       and e_final;
  end if;
  return new;
end;
$$;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

revoke all on function private.tem_perfil() from public, anon;
revoke all on function private.criar_perfil() from public, anon;
revoke all on function private.tocar_peca() from public, anon;
revoke all on function private.definir_semana_peca() from public, anon;
revoke all on function private.registrar_historico_peca() from public, anon;
revoke all on function private.marcar_autor_comentario() from public, anon;
revoke all on function private.marcar_autor_midia() from public, anon;
revoke all on function private.garantir_midia_final() from public, anon;

grant execute on function private.tem_perfil() to authenticated;
grant execute on function private.tocar_peca() to authenticated;
grant execute on function private.definir_semana_peca() to authenticated;
grant execute on function private.registrar_historico_peca() to authenticated;
grant execute on function private.marcar_autor_comentario() to authenticated;
grant execute on function private.marcar_autor_midia() to authenticated;
grant execute on function private.garantir_midia_final() to authenticated;

-- ---------------------------------------------------------------------------
-- Gatilhos
-- ---------------------------------------------------------------------------

drop trigger if exists criar_perfil_no_cadastro on auth.users;
create trigger criar_perfil_no_cadastro
  after insert on auth.users
  for each row execute function private.criar_perfil();

drop trigger if exists pecas_tocar on public.pecas;
create trigger pecas_tocar
  before insert or update on public.pecas
  for each row execute function private.tocar_peca();

drop trigger if exists pecas_semana on public.pecas;
create trigger pecas_semana
  before insert or update of data, praca_id on public.pecas
  for each row execute function private.definir_semana_peca();

drop trigger if exists pecas_historico on public.pecas;
create trigger pecas_historico
  after update on public.pecas
  for each row execute function private.registrar_historico_peca();

drop trigger if exists comentarios_autor on public.comentarios;
create trigger comentarios_autor
  before insert on public.comentarios
  for each row execute function private.marcar_autor_comentario();

drop trigger if exists midias_autor on public.midias;
create trigger midias_autor
  before insert on public.midias
  for each row execute function private.marcar_autor_midia();

drop trigger if exists midias_final on public.midias;
create trigger midias_final
  before insert or update of e_final on public.midias
  for each row execute function private.garantir_midia_final();

-- ---------------------------------------------------------------------------
-- Privilégios e RLS
-- Anônimo não lê nada. Autenticado com perfil lê e escreve o app inteiro.
-- ---------------------------------------------------------------------------

revoke all on public.perfis, public.pracas, public.semanas, public.pecas,
  public.midias, public.comentarios, public.historico, public.registro_bots
  from anon, authenticated;

grant select, update (nome, avatar_path) on public.perfis to authenticated;
grant select, insert, update, delete on public.pracas to authenticated;
grant select, insert, update, delete on public.semanas to authenticated;
grant select, insert, update, delete on public.pecas to authenticated;
grant select, insert, update, delete on public.midias to authenticated;
grant select, insert, update, delete on public.comentarios to authenticated;
grant select on public.historico to authenticated;

alter table public.perfis enable row level security;
alter table public.pracas enable row level security;
alter table public.semanas enable row level security;
alter table public.pecas enable row level security;
alter table public.midias enable row level security;
alter table public.comentarios enable row level security;
alter table public.historico enable row level security;
alter table public.registro_bots enable row level security;

drop policy if exists perfis_le on public.perfis;
create policy perfis_le on public.perfis
  for select to authenticated
  using ((select private.tem_perfil()));

drop policy if exists perfis_atualiza on public.perfis;
create policy perfis_atualiza on public.perfis
  for update to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

drop policy if exists pracas_equipe on public.pracas;
create policy pracas_equipe on public.pracas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

drop policy if exists semanas_equipe on public.semanas;
create policy semanas_equipe on public.semanas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

drop policy if exists pecas_equipe on public.pecas;
create policy pecas_equipe on public.pecas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

drop policy if exists midias_equipe on public.midias;
create policy midias_equipe on public.midias
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

drop policy if exists comentarios_equipe on public.comentarios;
create policy comentarios_equipe on public.comentarios
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

drop policy if exists historico_le on public.historico;
create policy historico_le on public.historico
  for select to authenticated
  using ((select private.tem_perfil()));
