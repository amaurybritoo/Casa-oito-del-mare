-- Histórico administrativo: registra alterações feitas por usuários autenticados.
-- Execute no SQL Editor do projeto Supabase antes de usar a seção Histórico (LOG).

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  record_id text,
  record_label text,
  actor_id uuid,
  actor_email text,
  actor_code_id text,
  actor_name text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_table_created_idx
  on public.admin_audit_log (table_name, created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon;
revoke insert, update, delete on public.admin_audit_log from authenticated;
grant select on public.admin_audit_log to authenticated;

drop policy if exists "Authenticated users can read admin audit log" on public.admin_audit_log;
create policy "Authenticated users can read admin audit log"
  on public.admin_audit_log for select to authenticated using (true);

create or replace function public.capture_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
  v_record_id text;
  v_label text;
  v_claims jsonb;
  v_app_metadata jsonb;
  v_actor_code_id text;
  v_actor_name text;
begin
  if tg_op = 'INSERT' then
    v_old := null;
    v_new := to_jsonb(new);
    v_row := v_new;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_row := v_new;
  else
    v_old := to_jsonb(old);
    v_new := null;
    v_row := v_old;
  end if;

  v_record_id := coalesce(v_row->>'id', v_row->>'key', 'registro');
  v_label := coalesce(
    nullif(v_row->>'title',''), nullif(v_row->>'name',''),
    nullif(v_row->>'key',''), nullif(v_row->>'label',''),
    case when tg_table_name = 'link_page_settings' then 'Configurações da página de links e reservas' end,
    'Registro ' || v_record_id
  );
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    v_claims := '{}'::jsonb;
  end;

  v_app_metadata := coalesce(v_claims->'app_metadata', '{}'::jsonb);
  v_actor_code_id := v_app_metadata->>'access_code_id';
  v_actor_name := case v_actor_code_id
    when 'fernanda' then 'Fernando'
    when 'monica' then 'Monica'
    when 'camila' then 'Camila'
    when 'admin' then 'Administrador'
    else null end;

  insert into public.admin_audit_log
    (table_name, action, record_id, record_label, actor_id, actor_email, actor_code_id, actor_name, old_data, new_data)
  values
    (tg_table_name, tg_op, v_record_id, v_label, auth.uid(),
     coalesce(v_claims->>'email', current_setting('request.jwt.claim.email', true)),
     v_actor_code_id, v_actor_name, v_old, v_new);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.capture_admin_audit_log() from public, anon, authenticated;

-- Instala somente em tabelas existentes neste projeto. Reservas são armazenadas
-- dentro de link_page_settings.availability e também ficam cobertas pelo trigger.
do $$
declare
  t text;
begin
  foreach t in array array[
    'gallery', 'videos', 'links', 'activities', 'site_content',
    'tourist_points', 'link_page_settings'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists admin_audit_log_trigger on public.%I', t);
      execute format(
        'create trigger admin_audit_log_trigger after insert or update or delete on public.%I for each row execute function public.capture_admin_audit_log()',
        t
      );
    end if;
  end loop;
end;
$$;

-- Atualiza instalações existentes sem apagar o histórico anterior.
alter table public.admin_audit_log add column if not exists actor_code_id text;
alter table public.admin_audit_log add column if not exists actor_name text;

notify pgrst, 'reload schema';
