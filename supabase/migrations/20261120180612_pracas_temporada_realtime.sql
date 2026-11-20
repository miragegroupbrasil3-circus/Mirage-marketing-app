-- A temporada (inicio/fim) já podia ser atualizada: a policy
-- pracas_equipe é FOR ALL e usa private.tem_perfil(), então qualquer
-- membro aprovado faz UPDATE. O check pracas_periodo exige fim >= inicio.
-- Aqui só reafirmamos a policy e publicamos a tabela no Realtime,
-- para o calendário e o progresso recalcularem quando as datas mudam.

drop policy if exists pracas_equipe on public.pracas;
create policy pracas_equipe on public.pracas
  for all to authenticated
  using ((select private.tem_perfil()))
  with check ((select private.tem_perfil()));

alter table public.pracas replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.pracas;
exception
  when duplicate_object then
    null;
  when undefined_object then
    raise notice 'Publicação supabase_realtime ausente. Ative o Realtime no projeto.';
end $$;
