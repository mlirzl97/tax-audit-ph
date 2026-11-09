create table public.organization_control_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  extension_decision_offset_days integer not null check (extension_decision_offset_days > 0),
  submission_target_business_days integer not null check (submission_target_business_days > 0),
  reminder_days integer[] not null check (cardinality(reminder_days) between 1 and 10),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table public.deadline_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  rule_name text not null check (char_length(rule_name) between 3 and 160),
  notice_type text not null check (
    notice_type in ('loa', 'nod', 'nic', 'pan', 'fan', 'fdda', 'sdt', 'mission_order', 'other')
  ),
  deadline_context text not null check (deadline_context in (
    'document_submission', 'pan_reply', 'fan_fld_protest',
    'reinvestigation_documents', 'other'
  )),
  response_days integer not null check (response_days > 0),
  calculation_method text not null default 'calendar_days_after_receipt'
    check (calculation_method = 'calendar_days_after_receipt'),
  extension_policy text not null check (
    extension_policy in ('allowed', 'not_allowed', 'supervisor_or_hod_decision')
  ),
  source_citation text not null check (char_length(source_citation) between 3 and 240),
  official_source_url text not null check (official_source_url ~ '^https://'),
  effective_from date not null,
  effective_to date,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from),
  check (
    deadline_context <> 'fan_fld_protest'
    or extension_policy = 'not_allowed'
  )
);

create table public.case_deadlines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null references public.audit_cases(id) on delete restrict,
  parent_deadline_id uuid references public.case_deadlines(id) on delete restrict,
  deadline_rule_id uuid references public.deadline_rules(id) on delete restrict,
  deadline_type text not null check (
    deadline_type in ('statutory', 'extension_decision', 'submission_target')
  ),
  source_event text not null check (source_event in (
    'notice_receipt', 'extension_acknowledgement', 'amended_or_reissued_notice',
    'additional_bir_request', 'meeting_minutes', 'corrected_receipt_date',
    'waiver_of_prescription', 'official_bir_extension', 'manual_professional_entry',
    'internal_offset'
  )),
  source_record_link text not null check (char_length(source_record_link) between 8 and 2000),
  version integer not null check (version > 0),
  deadline_date date not null,
  status text not null default 'preliminary' check (status in ('preliminary', 'confirmed', 'superseded')),
  calculated_by uuid not null references auth.users(id) on delete restrict,
  receipt_recorded_by_snapshot uuid not null references auth.users(id) on delete restrict,
  confirmed_by uuid references auth.users(id) on delete restrict,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (case_id, deadline_type, version),
  check (
    (deadline_type = 'statutory' and parent_deadline_id is null and source_event <> 'internal_offset')
    or (deadline_type <> 'statutory' and parent_deadline_id is not null and source_event = 'internal_offset')
  ),
  check (
    (status = 'confirmed' and confirmed_by is not null and confirmed_at is not null)
    or status <> 'confirmed'
  )
);

create index case_deadlines_case_status_idx
  on public.case_deadlines (case_id, status, deadline_date);

create or replace function private.subtract_weekdays(target_date date, target_days integer)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  result date := target_date;
  remaining integer := target_days;
begin
  while remaining > 0 loop
    result := result - 1;
    if extract(isodow from result) between 1 and 5 then remaining := remaining - 1; end if;
  end loop;
  return result;
end;
$$;

create or replace function private.audit_deadline_rule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.organization_id <> old.organization_id or new.created_by <> old.created_by then
      raise exception 'Deadline rule identity fields cannot be changed';
    end if;
    new.updated_by = (select auth.uid());
    new.updated_at = now();
  end if;
  perform private.write_control_audit(
    new.organization_id, null, null,
    case when tg_op = 'INSERT' then 'deadline_rule_created' else 'deadline_rule_changed' end,
    jsonb_build_object(
      'rule_id', new.id,
      'notice_type', new.notice_type,
      'source_citation', new.source_citation,
      'effective_from', new.effective_from
    )
  );
  return new;
end;
$$;

create or replace function public.set_deadline_control_settings(
  target_organization_id uuid,
  target_extension_decision_offset_days integer,
  target_submission_business_days integer,
  target_reminder_days integer[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if not private.has_org_role(target_organization_id, array['hod', 'super_admin']) then
    raise exception 'Only the HOD may configure deadline controls';
  end if;
  if target_extension_decision_offset_days <= 0
    or target_submission_business_days <= 0
    or cardinality(target_reminder_days) not between 1 and 10
    or exists (select 1 from unnest(target_reminder_days) day where day <= 0) then
    raise exception 'Invalid deadline control settings';
  end if;

  insert into public.organization_control_settings (
    organization_id, extension_decision_offset_days,
    submission_target_business_days, reminder_days, updated_by
  ) values (
    target_organization_id, target_extension_decision_offset_days,
    target_submission_business_days, target_reminder_days, actor
  )
  on conflict (organization_id) do update set
    extension_decision_offset_days = excluded.extension_decision_offset_days,
    submission_target_business_days = excluded.submission_target_business_days,
    reminder_days = excluded.reminder_days,
    updated_by = actor,
    updated_at = now();

  perform private.write_control_audit(
    target_organization_id, null, null, 'deadline_control_settings_changed',
    jsonb_build_object(
      'extension_decision_offset_days', target_extension_decision_offset_days,
      'submission_target_business_days', target_submission_business_days,
      'reminder_days', target_reminder_days
    )
  );
end;
$$;

create trigger audit_deadline_rule_before_write
  before insert or update on public.deadline_rules
  for each row execute function private.audit_deadline_rule();

create or replace function public.create_preliminary_deadline(
  target_case_id uuid,
  target_deadline_date date,
  target_source_event text,
  target_source_record_link text,
  target_rule_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_case public.audit_cases%rowtype;
  target_rule public.deadline_rules%rowtype;
  control_settings public.organization_control_settings%rowtype;
  next_version integer;
  statutory_id uuid;
  extension_decision_date date;
  submission_target_date date;
begin
  select * into target_case from public.audit_cases where id = target_case_id;
  if target_case.id is null or not private.can_access_case(target_case_id) then
    raise exception 'Case not found';
  end if;
  if not private.case_action_allowed(target_case_id, 'manage_deadline') then
    raise exception 'Deadline action is not allowed';
  end if;
  select * into control_settings from public.organization_control_settings
  where organization_id = target_case.organization_id;
  if control_settings.organization_id is null then
    raise exception 'The organization deadline controls have not been configured';
  end if;
  if target_source_event not in (
    'notice_receipt', 'extension_acknowledgement', 'amended_or_reissued_notice',
    'additional_bir_request', 'meeting_minutes', 'corrected_receipt_date',
    'waiver_of_prescription', 'official_bir_extension', 'manual_professional_entry'
  ) then
    raise exception 'Unsupported deadline source event';
  end if;
  if nullif(trim(target_source_record_link), '') is null then
    raise exception 'Every deadline version requires its source record link';
  end if;

  if target_rule_id is not null then
    select * into target_rule from public.deadline_rules where id = target_rule_id;
    if target_rule.id is null or target_rule.organization_id <> target_case.organization_id then
      raise exception 'Deadline rule is unavailable';
    end if;
    if target_case.received_date < target_rule.effective_from
      or (target_rule.effective_to is not null and target_case.received_date > target_rule.effective_to) then
      raise exception 'Deadline rule was not effective on the receipt date';
    end if;
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.case_deadlines
  where case_id = target_case_id and deadline_type = 'statutory';

  update public.case_deadlines
  set status = 'superseded'
  where case_id = target_case_id and status in ('preliminary', 'confirmed');

  insert into public.case_deadlines (
    organization_id, case_id, deadline_rule_id, deadline_type, source_event,
    source_record_link, version, deadline_date, calculated_by, receipt_recorded_by_snapshot
  ) values (
    target_case.organization_id, target_case_id, target_rule_id, 'statutory', target_source_event,
    target_source_record_link, next_version, target_deadline_date, actor, target_case.receipt_recorded_by
  ) returning id into statutory_id;

  extension_decision_date := target_deadline_date - control_settings.extension_decision_offset_days;
  -- shortcut: business days exclude weekends only; add the organization's holiday calendar before production use.
  submission_target_date := private.subtract_weekdays(
    target_deadline_date, control_settings.submission_target_business_days
  );

  insert into public.case_deadlines (
    organization_id, case_id, parent_deadline_id, deadline_rule_id, deadline_type,
    source_event, source_record_link, version, deadline_date, calculated_by,
    receipt_recorded_by_snapshot
  ) values
    (
      target_case.organization_id, target_case_id, statutory_id, target_rule_id,
      'extension_decision', 'internal_offset', target_source_record_link, next_version,
      extension_decision_date, actor, target_case.receipt_recorded_by
    ),
    (
      target_case.organization_id, target_case_id, statutory_id, target_rule_id,
      'submission_target', 'internal_offset', target_source_record_link, next_version,
      submission_target_date, actor, target_case.receipt_recorded_by
    );

  perform private.write_control_audit(
    target_case.organization_id, target_case.client_id, target_case_id, 'deadline_version_created',
    jsonb_build_object(
      'deadline_id', statutory_id,
      'version', next_version,
      'source_event', target_source_event,
      'statutory_date', target_deadline_date,
      'extension_decision_date', extension_decision_date,
      'submission_target_date', submission_target_date
    )
  );

  if extension_decision_date < (now() at time zone 'Asia/Manila')::date
    or submission_target_date < (now() at time zone 'Asia/Manila')::date then
    perform private.write_control_audit(
      target_case.organization_id, target_case.client_id, target_case_id, 'deadline_immediate_escalation',
      jsonb_build_object('deadline_id', statutory_id, 'version', next_version)
    );
  end if;
  return statutory_id;
end;
$$;

create or replace function public.calculate_preliminary_deadline(
  target_case_id uuid,
  target_rule_id uuid,
  target_source_record_link text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_case public.audit_cases%rowtype;
  target_rule public.deadline_rules%rowtype;
begin
  select * into target_case from public.audit_cases where id = target_case_id;
  select * into target_rule from public.deadline_rules where id = target_rule_id;
  if target_case.id is null or target_rule.id is null
    or target_rule.organization_id <> target_case.organization_id
    or target_rule.notice_type <> target_case.notice_type then
    raise exception 'The deadline rule does not apply to this case';
  end if;
  return public.create_preliminary_deadline(
    target_case_id,
    target_case.received_date + target_rule.response_days,
    'notice_receipt',
    target_source_record_link,
    target_rule_id
  );
end;
$$;

create or replace function public.confirm_deadline(target_deadline_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_deadline public.case_deadlines%rowtype;
  target_case public.audit_cases%rowtype;
begin
  select * into target_deadline from public.case_deadlines where id = target_deadline_id;
  if target_deadline.id is null or target_deadline.deadline_type <> 'statutory'
    or target_deadline.status <> 'preliminary' then
    raise exception 'Preliminary statutory deadline not found';
  end if;
  select * into target_case from public.audit_cases where id = target_deadline.case_id;
  if not private.can_access_case(target_case.id)
    or not private.has_org_role(target_case.organization_id, array['tax_supervisor', 'hod', 'super_admin']) then
    raise exception 'Only the Tax Supervisor or HOD may confirm a deadline';
  end if;
  if actor = target_deadline.calculated_by or actor = target_deadline.receipt_recorded_by_snapshot then
    raise exception 'The receipt recorder or deadline calculator cannot confirm the deadline';
  end if;

  update public.case_deadlines
  set status = 'confirmed', confirmed_by = actor, confirmed_at = now()
  where id = target_deadline_id or parent_deadline_id = target_deadline_id;

  perform private.write_control_audit(
    target_case.organization_id, target_case.client_id, target_case.id, 'deadline_confirmed',
    jsonb_build_object(
      'deadline_id', target_deadline_id,
      'version', target_deadline.version,
      'statutory_date', target_deadline.deadline_date
    )
  );
end;
$$;

create or replace view public.case_deadline_alerts
with (security_invoker = true)
as
select
  cd.id,
  cd.organization_id,
  cd.case_id,
  cd.parent_deadline_id,
  cd.deadline_type,
  cd.deadline_date,
  cd.status,
  cd.deadline_date - (now() at time zone 'Asia/Manila')::date as days_remaining,
  cd.deadline_date - (now() at time zone 'Asia/Manila')::date = any(settings.reminder_days)
    as reminder_due,
  case
    when cd.deadline_date < (now() at time zone 'Asia/Manila')::date then 'immediate_escalation'
    when cd.deadline_date - (now() at time zone 'Asia/Manila')::date = any(settings.reminder_days) then 'reminder'
    else 'none'
  end as alert_level
from public.case_deadlines cd
join public.organization_control_settings settings
  on settings.organization_id = cd.organization_id
where cd.status <> 'superseded';

alter table public.organization_control_settings enable row level security;
alter table public.deadline_rules enable row level security;
alter table public.case_deadlines enable row level security;

create policy "control_settings_select_tax_team" on public.organization_control_settings
  for select to authenticated using (private.has_org_role(
    organization_id, array['junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'super_admin']
  ));
create policy "deadline_rules_select_tax_team" on public.deadline_rules
  for select to authenticated using (private.has_org_role(
    organization_id, array['junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'super_admin']
  ));
create policy "deadline_rules_insert_leads" on public.deadline_rules
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and updated_by = (select auth.uid())
    and private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  );
create policy "deadline_rules_update_leads" on public.deadline_rules
  for update to authenticated using (
    private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  ) with check (
    private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  );

create policy "case_deadlines_select_case" on public.case_deadlines
  for select to authenticated using (private.can_access_case(case_id));

grant select on public.organization_control_settings to authenticated;
grant select, insert, update on public.deadline_rules to authenticated;
grant select on public.case_deadlines to authenticated;
grant select on public.case_deadline_alerts to authenticated;

revoke all on function public.set_deadline_control_settings(uuid, integer, integer, integer[]) from public;
revoke all on function public.set_deadline_control_settings(uuid, integer, integer, integer[]) from anon;
revoke all on function public.create_preliminary_deadline(uuid, date, text, text, uuid) from public;
revoke all on function public.create_preliminary_deadline(uuid, date, text, text, uuid) from anon;
revoke all on function public.calculate_preliminary_deadline(uuid, uuid, text) from public;
revoke all on function public.calculate_preliminary_deadline(uuid, uuid, text) from anon;
revoke all on function public.confirm_deadline(uuid) from public;
revoke all on function public.confirm_deadline(uuid) from anon;

grant execute on function public.set_deadline_control_settings(uuid, integer, integer, integer[]) to authenticated;
grant execute on function public.create_preliminary_deadline(uuid, date, text, text, uuid) to authenticated;
grant execute on function public.calculate_preliminary_deadline(uuid, uuid, text) to authenticated;
grant execute on function public.confirm_deadline(uuid) to authenticated;
