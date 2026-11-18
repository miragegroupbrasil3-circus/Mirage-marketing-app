-- Bucket privado `midias`, policies de storage e Realtime.
-- Limite de 50 MB por arquivo (plano gratuito do Supabase).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'midias',
  'midias',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists midias_select on storage.objects;
create policy midias_select on storage.objects
  for select to authenticated
  using (bucket_id = 'midias' and (select private.tem_perfil()));

drop policy if exists midias_insert on storage.objects;
create policy midias_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'midias' and (select private.tem_perfil()));

drop policy if exists midias_update on storage.objects;
create policy midias_update on storage.objects
  for update to authenticated
  using (bucket_id = 'midias' and (select private.tem_perfil()))
  with check (bucket_id = 'midias' and (select private.tem_perfil()));

drop policy if exists midias_delete on storage.objects;
create policy midias_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'midias' and (select private.tem_perfil()));

alter table public.pecas replica identity full;
alter table public.midias replica identity full;
alter table public.comentarios replica identity full;

do $$
declare
  tabela text;
begin
  foreach tabela in array array['pecas', 'midias', 'comentarios']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tabela);
    exception
      when duplicate_object then
        null;
      when undefined_object then
        raise notice 'Publicação supabase_realtime ausente. Ative o Realtime no projeto.';
    end;
  end loop;
end $$;
