-- Título próprio e exclusão de peça.
--
-- DELETE já estava na policy pecas_equipe (FOR ALL) para quem
-- private.tem_perfil() aprova. Comentários, histórico e mídias
-- caem em cascata desde o esquema inicial (on delete cascade).
-- O app também chama a Storage API antes do DELETE. Este gatilho
-- tira as linhas de storage.objects da peça, para o metadado não
-- ficar órfão se a exclusão vier do SQL.
--
-- O título vazio ou o placeholder "Nova peça" é recusado em INSERT
-- e em UPDATE que mencione a coluna titulo. Peças antigas com esse
-- título continuam até alguém renomear ou excluir: arrastar a data
-- não mexe no título e não dispara o gatilho.

create or replace function private.validar_titulo_peca()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  titulo text := btrim(coalesce(new.titulo, ''));
  chave text;
begin
  new.titulo := titulo;
  chave := lower(replace(replace(titulo, 'Ç', 'c'), 'ç', 'c'));
  if titulo = '' or char_length(titulo) > 180 or chave = 'nova peca' then
    raise exception 'A peça precisa de um título próprio.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.apagar_arquivos_da_peca()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    delete from storage.objects
     where bucket_id = 'midias'
       and name in (
         select midia.storage_path
         from public.midias as midia
         where midia.peca_id = old.id
       );
  exception
    when others then
      raise warning 'Arquivos da peça % não saíram por SQL (%). A API de storage é o caminho principal.', old.id, sqlerrm;
  end;
  return old;
end;
$$;

revoke all on function private.validar_titulo_peca() from public, anon;
revoke all on function private.apagar_arquivos_da_peca() from public, anon;
grant execute on function private.validar_titulo_peca() to authenticated;
grant execute on function private.apagar_arquivos_da_peca() to authenticated;

drop trigger if exists pecas_titulo on public.pecas;
create trigger pecas_titulo
  before insert or update of titulo on public.pecas
  for each row execute function private.validar_titulo_peca();

drop trigger if exists pecas_apagar_arquivos on public.pecas;
create trigger pecas_apagar_arquivos
  before delete on public.pecas
  for each row execute function private.apagar_arquivos_da_peca();

-- Reafirma leitura e escrita, inclusive DELETE, só com perfil aprovado.
drop policy if exists pecas_equipe on public.pecas;
create policy pecas_equipe on public.pecas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));
