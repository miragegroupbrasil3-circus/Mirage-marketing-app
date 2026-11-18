-- Opcional. Uma praça marcada como exemplo, sem datas de temporada,
-- sem peças, sem números e sem depoimentos. Inativa de propósito.

insert into public.pracas (cidade, slug, temporada, inicio, fim, ativa, e_exemplo)
select 'Exemplo', 'exemplo', null, null, null, false, true
where not exists (
  select 1 from public.pracas where slug = 'exemplo'
);
