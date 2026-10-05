-- Permite que administradores autenticados zerem os eventos do ano atual.
create or replace function public.reset_site_events_current_year()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  year_start timestamptz := date_trunc('year', now());
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.site_events
  where created_at >= year_start
    and created_at < year_start + interval '1 year';
end;
$$;

revoke all on function public.reset_site_events_current_year() from public, anon;
grant execute on function public.reset_site_events_current_year() to authenticated;

notify pgrst, 'reload schema';
