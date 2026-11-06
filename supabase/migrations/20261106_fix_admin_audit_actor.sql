-- Corrige identificação do responsável no LOG.
-- Primeiro usa a claim assinada do JWT; se a claim não estiver presente
-- (sessões antigas/refresh), consulta app_metadata mantido pelo servidor em auth.users.
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
  v_actor_email text;
begin
  if tg_op = 'INSERT' then
    v_old := null; v_new := to_jsonb(new); v_row := v_new;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old); v_new := to_jsonb(new); v_row := v_new;
  else
    v_old := to_jsonb(old); v_new := null; v_row := v_old;
  end if;

  v_record_id := coalesce(v_row->>'id', v_row->>'key', 'registro');
  v_label := coalesce(nullif(v_row->>'title',''), nullif(v_row->>'name',''),
    nullif(v_row->>'key',''), nullif(v_row->>'label',''),
    case when tg_table_name = 'link_page_settings' then 'Configurações da página de links e reservas' end,
    'Registro ' || v_record_id);

  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    v_claims := '{}'::jsonb;
  end;
  v_app_metadata := coalesce(v_claims->'app_metadata', '{}'::jsonb);
  v_actor_code_id := nullif(v_app_metadata->>'access_code_id','');
  v_actor_email := coalesce(v_claims->>'email', current_setting('request.jwt.claim.email', true));

  -- Fallback confiável: app_metadata só pode ser alterado pela Admin API/service role.
  if v_actor_code_id is null and auth.uid() is not null then
    select u.raw_app_meta_data->>'access_code_id', u.email
      into v_actor_code_id, v_actor_email
      from auth.users u where u.id = auth.uid();
  end if;

  v_actor_name := case v_actor_code_id
    when 'fernanda' then 'Fernando'
    when 'fernando' then 'Fernando'
    when 'monica' then 'Monica'
    when 'camila' then 'Camila'
    when 'admin' then 'Administrador'
    else null end;

  insert into public.admin_audit_log
    (table_name, action, record_id, record_label, actor_id, actor_email,
     actor_code_id, actor_name, old_data, new_data)
  values
    (tg_table_name, tg_op, v_record_id, v_label, auth.uid(), v_actor_email,
     v_actor_code_id, v_actor_name, v_old, v_new);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.capture_admin_audit_log() from public, anon, authenticated;
notify pgrst, 'reload schema';
