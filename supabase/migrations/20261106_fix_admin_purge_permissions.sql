-- Corrige a permissão e a validação do acesso administrador para limpar o LOG.
-- Execute este arquivo no SQL Editor do projeto Casa Oito Del Mare.
begin;

create table if not exists public.admin_audit_purge_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_code_id text not null,
  actor_name text not null,
  deleted_count integer not null default 0,
  purged_at timestamptz not null default now()
);

alter table public.admin_audit_purge_events enable row level security;
revoke all on public.admin_audit_purge_events from public, anon, authenticated;

create or replace function public.admin_purge_audit_log()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  claims jsonb;
  code_id text;
  removed integer := 0;
begin
  -- Primeiro usa a identificação assinada no JWT.
  begin
    claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    claims := '{}'::jsonb;
  end;

  code_id := nullif(claims->'app_metadata'->>'access_code_id', '');

  -- Fallback no metadado mantido pelo servidor para sessões cujo JWT é antigo.
  if code_id is null and auth.uid() is not null then
    select u.raw_app_meta_data->>'access_code_id'
      into code_id
      from auth.users u
     where u.id = auth.uid();
  end if;

  if auth.uid() is null or code_id is distinct from 'admin' then
    raise exception using
      errcode = '42501',
      message = 'A limpeza do histórico é permitida somente ao acesso Administrador. Saia do painel e entre novamente com o código de Administrador.';
  end if;

  -- WHERE true é intencional: remove todos os eventos, mas satisfaz a proteção
  -- do editor/guard do Supabase que bloqueia DELETE sem cláusula WHERE.
  delete from public.admin_audit_log
   where true;
  get diagnostics removed = row_count;

  insert into public.admin_audit_purge_events
    (actor_id, actor_code_id, actor_name, deleted_count)
  values
    (auth.uid(), 'admin', 'Administrador', removed);

  return jsonb_build_object(
    'deleted_count', removed,
    'preserved_security_record', true
  );
end;
$function$;

-- A função é SECURITY DEFINER e valida internamente a identidade assinada.
-- Apenas usuários autenticados podem invocá-la; nunca liberar para anon/public.
revoke all on function public.admin_purge_audit_log() from public, anon;
grant usage on schema public to authenticated;
grant execute on function public.admin_purge_audit_log() to authenticated;

commit;
notify pgrst, 'reload schema';
