alter table public.audit_cases
  add column bir_officer_present text not null default 'not_sure'
    check (bir_officer_present in ('yes', 'no', 'not_sure')),
  add column enforcement_terms_mentioned text not null default 'not_sure'
    check (enforcement_terms_mentioned in ('yes', 'no', 'not_sure')),
  add column response_period_mentioned text not null default 'not_sure'
    check (response_period_mentioned in ('yes', 'no', 'not_sure')),
  add column delivery_method text not null default 'not_sure'
    check (delivery_method in ('hand_delivery', 'mail_courier', 'email', 'bir_portal', 'not_sure'));

create or replace function public.log_case_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_fields text[];
begin
  changed_fields := array_remove(array[
    case when new.client_reference is distinct from old.client_reference then 'client_reference' end,
    case when new.notice_type is distinct from old.notice_type then 'notice_type' end,
    case when new.received_date is distinct from old.received_date then 'received_date' end,
    case when new.stage is distinct from old.stage then 'stage' end,
    case when new.bir_officer_present is distinct from old.bir_officer_present then 'bir_officer_present' end,
    case when new.enforcement_terms_mentioned is distinct from old.enforcement_terms_mentioned then 'enforcement_terms_mentioned' end,
    case when new.response_period_mentioned is distinct from old.response_period_mentioned then 'response_period_mentioned' end,
    case when new.delivery_method is distinct from old.delivery_method then 'delivery_method' end
  ], null);

  if cardinality(changed_fields) > 0 then
    insert into public.case_events (case_id, organization_id, actor_id, event_type, details)
    values (new.id, new.organization_id, (select auth.uid()), 'case_updated', jsonb_build_object('changed_fields', changed_fields));
  end if;
  return new;
end;
$$;

revoke all on function public.log_case_update() from public;
