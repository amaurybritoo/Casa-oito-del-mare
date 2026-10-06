-- Atualização instantânea: a página de links recebe mudanças de reservas e cards sem recarregar.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'link_page_settings'
  ) then
    alter publication supabase_realtime add table public.link_page_settings;
  end if;
end $$;
