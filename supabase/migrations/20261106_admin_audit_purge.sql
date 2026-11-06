-- Controle seguro de limpeza do histórico administrativo.
-- A limpeza só pode ser solicitada por uma sessão cujo app_metadata foi
-- definido pelo servidor de autenticação com access_code_id = 'admin'.
create table if not exists public.admin_audit_purge_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_code_id text not null,
  actor_name text not null,
  deleted_count integer not null default 0,
  purged_at timestamptz not null default now()
);
alter table public.admin_audit_purge_events enable row level security;
revoke all on public.admin_audit_purge_events from anon, authenticated;
create or replace function public.admin_purge_audit_log()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  claims jsonb;
  code_id text;
  removed integer;
begin
  begin
    claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    claims := '{}'::jsonb;
  end;
  code_id := claims->'app_metadata'->>'access_code_id';
  if code_id is distinct from 'admin' then
    raise exception 'Apenas o Administrador pode limpar o histórico.';
  end if;
  delete from public.admin_audit_log;
  get diagnostics removed = row_count;
  insert into public.admin_audit_purge_events(actor_id, actor_code_id, actor_name, deleted_count)
  values (auth.uid(), 'admin', 'Administrador', removed);
  return jsonb_build_object('deleted_count', removed, 'preserved_security_record', true);
end;
$$;
revoke all on function public.admin_purge_audit_log() from public, anon;
grant execute on function public.admin_purge_audit_log() to authenticated;
notify pgrst, 'reload schema';
