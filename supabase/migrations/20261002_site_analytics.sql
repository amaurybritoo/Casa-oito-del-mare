-- CASA OITO DEL MARE: contagem anônima de visitas e cliques no WhatsApp.
-- Execute uma vez no SQL Editor do Supabase.

create table if not exists public.site_events (
  event_type text not null check (event_type in ('visit', 'whatsapp_click')),
  page text not null check (page in ('home', 'links')),
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_type_idx
  on public.site_events (created_at desc, event_type);

alter table public.site_events enable row level security;

drop policy if exists "authenticated can read site events" on public.site_events;
create policy "authenticated can read site events"
  on public.site_events for select to authenticated using (true);

revoke all on public.site_events from anon, authenticated;
grant select on public.site_events to authenticated;

create or replace function public.record_site_event(p_event_type text, p_page text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type is null or p_event_type not in ('visit', 'whatsapp_click') then
    raise exception 'Invalid event type';
  end if;
  if p_page is null or p_page not in ('home', 'links') then
    raise exception 'Invalid page';
  end if;

  insert into public.site_events (event_type, page)
  values (p_event_type, p_page);
end;
$$;

revoke all on function public.record_site_event(text, text) from public;
grant execute on function public.record_site_event(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
