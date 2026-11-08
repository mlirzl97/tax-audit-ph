create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_org_member(uuid) set schema private;
alter function public.is_org_owner(uuid) set schema private;

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_owner(uuid) from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_owner(uuid) to authenticated;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
