create table public.organization_member_roles (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'system_admin', 'super_admin'
  )),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id, role),
  foreign key (organization_id, user_id)
    references public.organization_members(organization_id, user_id) on delete cascade
);

insert into public.organization_member_roles (organization_id, user_id, role)
select organization_id, user_id, 'super_admin'
from public.organization_members
where role = 'owner'
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_organization_id uuid;
begin
  insert into public.organizations (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'workspace_name', ''), 'My case workspace'))
  returning id into new_organization_id;

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'display_name');

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, new.id, 'owner');

  insert into public.organization_member_roles (organization_id, user_id, role)
  values (new_organization_id, new.id, 'super_admin');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create or replace function private.has_org_role(target_organization_id uuid, accepted_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_member_roles
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and role = any(accepted_roles)
  );
$$;

revoke all on function private.has_org_role(uuid, text[]) from public;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_reference text not null check (char_length(client_reference) between 2 and 120),
  cluster_leader_id uuid not null references auth.users(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_reference)
);

create or replace function private.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and private.has_org_role(
        c.organization_id,
        array['junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'super_admin']
      )
  );
$$;

create table public.case_assignments (
  case_id uuid not null references public.audit_cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  assignment_role text not null check (assignment_role in ('preparer', 'checker', 'technical_reviewer', 'case_owner')),
  assigned_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (case_id, assignment_role),
  unique (case_id, user_id, assignment_role)
);

create index clients_cluster_leader_idx
  on public.clients (organization_id, cluster_leader_id)
  where active;

create index case_assignments_user_idx
  on public.case_assignments (user_id, case_id);

alter table public.audit_cases
  drop constraint if exists audit_cases_notice_type_check,
  drop constraint if exists audit_cases_stage_check;

update public.audit_cases set stage = case stage
  when 'intake' then 'received'
  when 'records' then 'client_data_request'
  when 'review' then 'checking'
  when 'response' then 'drafting'
  when 'submitted' then 'submission'
  else stage
end;

alter table public.audit_cases
  add column client_id uuid references public.clients(id) on delete restrict,
  add column receipt_recorded_by uuid references auth.users(id) on delete restrict,
  add column crf_status text not null default 'not_requested'
    check (crf_status in ('not_requested', 'sent', 'signed')),
  add column crf_record_link text,
  add column crf_sent_at timestamptz,
  add column crf_signed_at timestamptz,
  add column crf_override_reason text,
  add column crf_override_by uuid references auth.users(id) on delete restrict,
  add column crf_override_at timestamptz,
  add column authority_type text not null default 'none'
    check (authority_type in ('none', 'spa', 'authorization_letter')),
  add column authority_record_link text,
  add column authority_record_version text,
  add column authority_record_hash text,
  add column client_conforme_status text not null default 'not_requested'
    check (client_conforme_status in ('not_requested', 'requested', 'received')),
  add column client_conforme_record_link text,
  add column client_conforme_received_at timestamptz,
  add column extension_prepared_by uuid references auth.users(id) on delete restrict,
  add column extension_approved_by uuid references auth.users(id) on delete restrict,
  add column extension_approved_at timestamptz,
  add column bir_response_prepared_by uuid references auth.users(id) on delete restrict,
  add column bir_response_approved_by uuid references auth.users(id) on delete restrict,
  add column bir_response_approved_at timestamptz,
  add constraint audit_cases_crf_link_https check (
    crf_record_link is null or crf_record_link ~ '^https://'
  ),
  add constraint audit_cases_authority_link_https check (
    authority_record_link is null or authority_record_link ~ '^https://'
  ),
  add constraint audit_cases_conforme_link_https check (
    client_conforme_record_link is null or client_conforme_record_link ~ '^https://'
  ),
  add constraint audit_cases_authority_version_length check (
    authority_record_version is null or char_length(authority_record_version) <= 240
  ),
  add constraint audit_cases_authority_hash_length check (
    authority_record_hash is null or char_length(authority_record_hash) <= 240
  ),
  add constraint audit_cases_notice_type_check check (
    notice_type in ('loa', 'nod', 'nic', 'pan', 'fan', 'fdda', 'sdt', 'mission_order', 'other')
  ),
  add constraint audit_cases_stage_check check (stage in (
    'engagement_setup', 'received', 'validating', 'triage', 'risk_assessment',
    'client_data_request', 'reconciliation', 'drafting', 'checking',
    'technical_review', 'client_conforme', 'submission', 'bir_follow_up',
    'resolution_or_protest', 'closed'
  ));

update public.audit_cases
set receipt_recorded_by = created_by
where receipt_recorded_by is null;

alter table public.audit_cases alter column receipt_recorded_by set not null;

create index audit_cases_client_updated_idx
  on public.audit_cases (client_id, updated_at desc)
  where client_id is not null;

create or replace function private.can_access_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.audit_cases ac
    left join public.clients c on c.id = ac.client_id
    where ac.id = target_case_id
      and (
        private.has_org_role(ac.organization_id, array['tax_supervisor', 'hod', 'super_admin'])
        or ac.created_by = (select auth.uid())
        or (c.cluster_leader_id = (select auth.uid())
          and private.has_org_role(ac.organization_id, array['cluster_leader']))
        or exists (
          select 1 from public.case_assignments ca
          where ca.case_id = ac.id and ca.user_id = (select auth.uid())
        )
      )
  );
$$;

create table public.control_audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid references public.clients(id) on delete restrict,
  case_id uuid references public.audit_cases(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 3 and 80),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index control_audit_log_case_created_idx
  on public.control_audit_log (case_id, created_at desc)
  where case_id is not null;

create index control_audit_log_client_created_idx
  on public.control_audit_log (client_id, created_at desc)
  where client_id is not null;

create or replace function private.write_control_audit(
  target_organization_id uuid,
  target_client_id uuid,
  target_case_id uuid,
  target_event_type text,
  target_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.control_audit_log (
    organization_id, client_id, case_id, actor_id, event_type, details
  ) values (
    target_organization_id, target_client_id, target_case_id,
    (select auth.uid()), target_event_type, target_details
  );
end;
$$;

create or replace function private.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit history is immutable';
end;
$$;

create trigger control_audit_log_immutable
  before update or delete on public.control_audit_log
  for each row execute function private.reject_audit_mutation();

create or replace function private.validate_client_cluster_leader()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    new.id <> old.id
    or new.organization_id <> old.organization_id
    or new.created_by <> old.created_by
  ) then
    raise exception 'Client identity fields cannot be changed';
  end if;
  if not exists (
    select 1 from public.organization_member_roles
    where organization_id = new.organization_id
      and user_id = new.cluster_leader_id
      and role = 'cluster_leader'
  ) then
    raise exception 'Client Cluster Leader must hold the Cluster Leader role in the organization';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger validate_client_cluster_leader_before_write
  before insert or update on public.clients
  for each row execute function private.validate_client_cluster_leader();

create or replace function private.audit_client_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.cluster_leader_id is distinct from old.cluster_leader_id then
    perform private.write_control_audit(
      new.organization_id, new.id, null,
      case when tg_op = 'INSERT' then 'client_created' else 'client_cluster_leader_changed' end,
      jsonb_build_object(
        'previous_cluster_leader_id', case when tg_op = 'UPDATE' then old.cluster_leader_id else null end,
        'cluster_leader_id', new.cluster_leader_id
      )
    );
  end if;
  return new;
end;
$$;

create trigger audit_client_change_after_write
  after insert or update on public.clients
  for each row execute function private.audit_client_change();

create or replace function private.validate_case_client()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_id is not null and not exists (
    select 1 from public.clients
    where id = new.client_id and organization_id = new.organization_id
  ) then
    raise exception 'Case client must belong to the same organization';
  end if;
  return new;
end;
$$;

create trigger validate_case_client_before_write
  before insert or update on public.audit_cases
  for each row execute function private.validate_case_client();

create or replace function private.validate_case_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_organization_id uuid;
begin
  if tg_op = 'UPDATE' and (
    new.case_id <> old.case_id
    or new.organization_id <> old.organization_id
    or new.assignment_role <> old.assignment_role
    or new.assigned_by <> old.assigned_by
  ) then
    raise exception 'Assignment identity fields cannot be changed';
  end if;
  select organization_id into target_organization_id
  from public.audit_cases where id = new.case_id;

  if target_organization_id is null or target_organization_id <> new.organization_id then
    raise exception 'Case assignment organization does not match the case';
  end if;
  if not exists (
    select 1 from public.organization_members
    where organization_id = new.organization_id and user_id = new.user_id
  ) then
    raise exception 'Assigned user is not a member of the organization';
  end if;
  if new.assignment_role in ('preparer', 'checker', 'technical_reviewer') and exists (
    select 1 from public.case_assignments
    where case_id = new.case_id
      and user_id = new.user_id
      and assignment_role in ('preparer', 'checker', 'technical_reviewer')
      and assignment_role <> new.assignment_role
  ) then
    raise exception 'Preparation, checking, and technical review must be assigned to different people';
  end if;
  return new;
end;
$$;

create trigger validate_case_assignment_before_write
  before insert or update on public.case_assignments
  for each row execute function private.validate_case_assignment();

create or replace function private.audit_case_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.write_control_audit(
    new.organization_id,
    (select client_id from public.audit_cases where id = new.case_id),
    new.case_id,
    case when tg_op = 'INSERT' then 'case_assignment_created' else 'case_assignment_changed' end,
    jsonb_build_object(
      'assignment_role', new.assignment_role,
      'previous_user_id', case when tg_op = 'UPDATE' then old.user_id else null end,
      'user_id', new.user_id
    )
  );
  return new;
end;
$$;

create trigger audit_case_assignment_after_write
  after insert or update on public.case_assignments
  for each row execute function private.audit_case_assignment();

create or replace function private.protect_case_controls()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if new.client_id is distinct from old.client_id and not private.has_org_role(
    old.organization_id, array['tax_supervisor', 'hod', 'super_admin']
  ) then
    raise exception 'Only the Tax Supervisor or HOD may change the client on a case';
  end if;

  if new.crf_status = 'signed' and nullif(trim(new.crf_record_link), '') is null then
    raise exception 'A signed CRF requires its SharePoint record link';
  end if;
  if old.crf_status = 'signed' and new.crf_status <> 'signed' then
    raise exception 'A signed CRF cannot be reverted to an unsigned status';
  end if;
  if new.crf_status = 'signed' and new.crf_signed_at is null then
    new.crf_signed_at = now();
  end if;
  if new.crf_status = 'sent' and new.crf_sent_at is null then
    new.crf_sent_at = now();
  end if;

  if new.crf_override_reason is distinct from old.crf_override_reason then
    if not private.has_org_role(old.organization_id, array['tax_supervisor', 'hod', 'super_admin']) then
      raise exception 'Only the Tax Supervisor or HOD may change a CRF override';
    elsif nullif(trim(new.crf_override_reason), '') is null then
      new.crf_override_by = null;
      new.crf_override_at = null;
    else
      new.crf_override_by = actor;
      new.crf_override_at = now();
    end if;
  end if;

  if new.authority_type <> 'none' and nullif(trim(new.authority_record_link), '') is null then
    raise exception 'Authority to represent requires its SharePoint record link';
  end if;
  if new.client_conforme_status = 'received'
    and nullif(trim(new.client_conforme_record_link), '') is null then
    raise exception 'Client conforme requires its email or SharePoint record link';
  end if;
  if new.client_conforme_status = 'received' and new.client_conforme_received_at is null then
    new.client_conforme_received_at = now();
  end if;
  if new.extension_prepared_by is distinct from old.extension_prepared_by then
    if new.extension_prepared_by is null or new.extension_prepared_by <> actor then
      raise exception 'The authenticated user must be recorded as the extension preparer';
    end if;
  end if;
  if new.bir_response_prepared_by is distinct from old.bir_response_prepared_by then
    if new.bir_response_prepared_by is null or new.bir_response_prepared_by <> actor then
      raise exception 'The authenticated user must be recorded as the response preparer';
    end if;
  end if;

  if new.stage in ('submission', 'bir_follow_up')
    and old.stage not in ('submission', 'bir_follow_up')
    and (new.authority_type = 'none' or new.client_conforme_status <> 'received') then
    raise exception 'BIR-facing stages require authority to represent and client conforme';
  end if;

  if new.extension_approved_by is distinct from old.extension_approved_by then
    if new.extension_approved_by is null
      or new.extension_approved_by <> actor
      or not private.has_org_role(old.organization_id, array['tax_supervisor', 'hod', 'super_admin']) then
      raise exception 'Extension requests must be approved by the Tax Supervisor or HOD';
    end if;
    if new.extension_prepared_by is null then raise exception 'Record the extension preparer before approval'; end if;
    if new.extension_prepared_by = actor then raise exception 'Nobody may approve their own work'; end if;
    new.extension_approved_at = now();
  end if;
  if new.bir_response_approved_by is distinct from old.bir_response_approved_by then
    if new.bir_response_approved_by is null
      or new.bir_response_approved_by <> actor
      or not private.has_org_role(old.organization_id, array['tax_supervisor', 'hod', 'super_admin']) then
      raise exception 'BIR responses must be approved by the Tax Supervisor or HOD';
    end if;
    if new.bir_response_prepared_by is null then raise exception 'Record the response preparer before approval'; end if;
    if new.bir_response_prepared_by = actor then raise exception 'Nobody may approve their own work'; end if;
    new.bir_response_approved_at = now();
  end if;
  return new;
end;
$$;

create trigger protect_case_controls_before_update
  before update on public.audit_cases
  for each row execute function private.protect_case_controls();

create or replace function private.audit_case_controls()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_fields text[];
begin
  changed_fields := array_remove(array[
    case when new.client_id is distinct from old.client_id then 'client_id' end,
    case when new.crf_status is distinct from old.crf_status then 'crf_status' end,
    case when new.crf_record_link is distinct from old.crf_record_link then 'crf_record_link' end,
    case when new.crf_override_reason is distinct from old.crf_override_reason then 'crf_override' end,
    case when new.authority_type is distinct from old.authority_type then 'authority_type' end,
    case when new.authority_record_link is distinct from old.authority_record_link then 'authority_record_link' end,
    case when new.authority_record_version is distinct from old.authority_record_version then 'authority_record_version' end,
    case when new.authority_record_hash is distinct from old.authority_record_hash then 'authority_record_hash' end,
    case when new.client_conforme_status is distinct from old.client_conforme_status then 'client_conforme_status' end,
    case when new.client_conforme_record_link is distinct from old.client_conforme_record_link then 'client_conforme_record_link' end,
    case when new.extension_prepared_by is distinct from old.extension_prepared_by then 'extension_preparer' end,
    case when new.extension_approved_by is distinct from old.extension_approved_by then 'extension_approval' end,
    case when new.bir_response_approved_by is distinct from old.bir_response_approved_by then 'bir_response_approval' end
  ], null);

  if cardinality(changed_fields) > 0 then
    perform private.write_control_audit(
      new.organization_id, new.client_id, new.id, 'case_controls_changed',
      jsonb_build_object(
        'changed_fields', changed_fields,
        'crf_status', new.crf_status,
        'authority_type', new.authority_type,
        'client_conforme_status', new.client_conforme_status
      )
    );
  end if;
  return new;
end;
$$;

create trigger audit_case_controls_after_update
  after update on public.audit_cases
  for each row execute function private.audit_case_controls();

create or replace function private.case_action_allowed(target_case_id uuid, target_action text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when target_action in ('log_notice', 'manage_deadline', 'draft_extension', 'request_extension') then true
      when target_action = 'release_extension' then
        ac.authority_type <> 'none'
        and ac.client_conforme_status = 'received'
        and ac.extension_approved_by is not null
      when target_action in ('reconciliation', 'position_paper', 'draft_bir_response') then
        ac.crf_status = 'signed' or ac.crf_override_by is not null
      when target_action in ('finalize_bir_response', 'release_bir_response') then
        (ac.crf_status = 'signed' or ac.crf_override_by is not null)
        and ac.authority_type <> 'none'
        and ac.client_conforme_status = 'received'
        and ac.bir_response_approved_by is not null
      else false
    end
    from public.audit_cases ac
    where ac.id = target_case_id and private.can_access_case(ac.id)
  ), false);
$$;

create or replace function public.can_perform_case_action(target_case_id uuid, target_action text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.case_action_allowed(target_case_id, target_action);
$$;

create or replace function public.set_member_role(
  target_organization_id uuid,
  target_user_id uuid,
  target_role text,
  enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_role not in (
    'junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'system_admin'
  ) then
    raise exception 'Unsupported assignable role';
  end if;
  if not exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id and user_id = target_user_id
  ) then
    raise exception 'Target user is not an organization member';
  end if;
  if target_role in ('hod', 'system_admin') then
    if not private.has_org_role(target_organization_id, array['super_admin']) then
      raise exception 'Only a Super Admin may assign HOD or System Administration';
    end if;
  elsif not private.has_org_role(target_organization_id, array['hod', 'super_admin']) then
    raise exception 'Only the HOD may assign Tax Team roles';
  end if;

  if enabled then
    insert into public.organization_member_roles (organization_id, user_id, role)
    values (target_organization_id, target_user_id, target_role)
    on conflict do nothing;
  else
    delete from public.organization_member_roles
    where organization_id = target_organization_id and user_id = target_user_id and role = target_role;
  end if;

  perform private.write_control_audit(
    target_organization_id, null, null, 'member_role_changed',
    jsonb_build_object('user_id', target_user_id, 'role', target_role, 'enabled', enabled)
  );
end;
$$;

create table public.client_risk_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  version integer not null check (version > 0),
  materiality_basis text not null check (materiality_basis in (
    'annual_revenue', 'annual_tax_paid', 'net_assets', 'fixed_peso'
  )),
  basis_amount numeric(20, 2),
  medium_boundary numeric(20, 6) not null check (medium_boundary >= 0),
  high_boundary numeric(20, 6) not null check (high_boundary > medium_boundary),
  status text not null default 'draft' check (status in ('draft', 'approved', 'superseded')),
  proposed_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, version),
  check (
    (materiality_basis = 'fixed_peso' and basis_amount is null)
    or (materiality_basis <> 'fixed_peso' and basis_amount > 0)
  )
);

create unique index client_risk_profiles_one_approved_idx
  on public.client_risk_profiles (client_id)
  where status = 'approved';

create table public.organization_risk_trigger_rules (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  trigger_key text not null check (trigger_key ~ '^[a-z][a-z0-9_]{2,79}$'),
  minimum_tier text not null check (minimum_tier in ('low', 'medium', 'high')),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (organization_id, trigger_key)
);

create table public.case_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  case_id uuid not null references public.audit_cases(id) on delete restrict,
  client_risk_profile_id uuid references public.client_risk_profiles(id) on delete restrict,
  basic_tax numeric(20, 2) not null check (basic_tax >= 0),
  surcharge numeric(20, 2) not null check (surcharge >= 0),
  interest numeric(20, 2) not null check (interest >= 0),
  exposure numeric(20, 2) generated always as (basic_tax + surcharge + interest) stored,
  exposure_rating text not null check (exposure_rating in ('rated', 'unrated')),
  non_monetary_triggers text[] not null default '{}'::text[],
  calculated_tier text not null check (calculated_tier in ('low', 'medium', 'high')),
  final_tier text not null check (final_tier in ('low', 'medium', 'high')),
  change_justification text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'superseded')),
  external_counsel_required boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index case_risk_assessments_case_created_idx
  on public.case_risk_assessments (case_id, created_at desc);

create or replace function private.risk_rank(tier text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case tier when 'low' then 1 when 'medium' then 2 when 'high' then 3 else 0 end;
$$;

create or replace function public.set_risk_trigger_rule(
  target_organization_id uuid,
  target_trigger_key text,
  target_minimum_tier text
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
    raise exception 'Only the HOD may configure risk trigger rules';
  end if;
  if target_trigger_key !~ '^[a-z][a-z0-9_]{2,79}$'
    or target_minimum_tier not in ('low', 'medium', 'high') then
    raise exception 'Invalid risk trigger rule';
  end if;

  insert into public.organization_risk_trigger_rules (
    organization_id, trigger_key, minimum_tier, updated_by
  ) values (
    target_organization_id, target_trigger_key, target_minimum_tier, actor
  )
  on conflict (organization_id, trigger_key) do update set
    minimum_tier = excluded.minimum_tier,
    updated_by = actor,
    updated_at = now();

  perform private.write_control_audit(
    target_organization_id, null, null, 'risk_trigger_rule_changed',
    jsonb_build_object('trigger_key', target_trigger_key, 'minimum_tier', target_minimum_tier)
  );
end;
$$;

create or replace function public.propose_client_risk_profile(
  target_client_id uuid,
  target_materiality_basis text,
  target_basis_amount numeric,
  target_medium_boundary numeric,
  target_high_boundary numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_client public.clients%rowtype;
  next_version integer;
  new_profile_id uuid;
begin
  select * into target_client from public.clients where id = target_client_id;
  if target_client.id is null then raise exception 'Client not found'; end if;
  if actor <> target_client.cluster_leader_id
    and not private.has_org_role(target_client.organization_id, array['tax_supervisor', 'hod', 'super_admin']) then
    raise exception 'Only the client Cluster Leader, Tax Supervisor, or HOD may propose the risk profile';
  end if;
  if target_materiality_basis not in ('annual_revenue', 'annual_tax_paid', 'net_assets', 'fixed_peso')
    or target_medium_boundary < 0 or target_high_boundary <= target_medium_boundary
    or (target_materiality_basis = 'fixed_peso' and target_basis_amount is not null)
    or (target_materiality_basis <> 'fixed_peso' and coalesce(target_basis_amount, 0) <= 0) then
    raise exception 'Invalid client risk profile';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.client_risk_profiles where client_id = target_client_id;

  insert into public.client_risk_profiles (
    organization_id, client_id, version, materiality_basis, basis_amount,
    medium_boundary, high_boundary, proposed_by
  ) values (
    target_client.organization_id, target_client_id, next_version, target_materiality_basis,
    target_basis_amount, target_medium_boundary, target_high_boundary, actor
  ) returning id into new_profile_id;

  perform private.write_control_audit(
    target_client.organization_id, target_client_id, null, 'client_risk_profile_proposed',
    jsonb_build_object('profile_id', new_profile_id, 'version', next_version)
  );
  return new_profile_id;
end;
$$;

create or replace function public.approve_client_risk_profile(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_profile public.client_risk_profiles%rowtype;
begin
  select * into target_profile from public.client_risk_profiles where id = target_profile_id;
  if target_profile.id is null then raise exception 'Risk profile not found'; end if;
  if not private.has_org_role(target_profile.organization_id, array['hod', 'super_admin']) then
    raise exception 'Only the HOD may approve a client risk profile';
  end if;
  if actor = target_profile.proposed_by then raise exception 'Nobody may approve their own work'; end if;

  update public.client_risk_profiles
  set status = 'superseded'
  where client_id = target_profile.client_id and status = 'approved';

  update public.client_risk_profiles
  set status = 'approved', approved_by = actor, approved_at = now()
  where id = target_profile_id and status = 'draft';

  if not found then raise exception 'Only a draft risk profile may be approved'; end if;
  perform private.write_control_audit(
    target_profile.organization_id, target_profile.client_id, null, 'client_risk_profile_approved',
    jsonb_build_object('profile_id', target_profile_id, 'version', target_profile.version)
  );
end;
$$;

create or replace function public.record_case_risk_assessment(
  target_case_id uuid,
  target_basic_tax numeric,
  target_surcharge numeric,
  target_interest numeric,
  target_triggers text[],
  requested_tier text,
  target_justification text,
  target_external_counsel_required boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  target_case public.audit_cases%rowtype;
  target_client public.clients%rowtype;
  risk_profile public.client_risk_profiles%rowtype;
  current_assessment public.case_risk_assessments%rowtype;
  target_exposure numeric;
  medium_amount numeric;
  high_amount numeric;
  trigger_tier text;
  derived_tier text;
  final_tier text;
  new_assessment_id uuid;
begin
  select * into target_case from public.audit_cases where id = target_case_id;
  if target_case.id is null or target_case.client_id is null or not private.can_access_case(target_case_id) then
    raise exception 'Case is unavailable or has no client';
  end if;
  if target_basic_tax < 0 or target_surcharge < 0 or target_interest < 0 then
    raise exception 'Exposure components cannot be negative';
  end if;
  if exists (
    select 1
    from unnest(coalesce(target_triggers, '{}'::text[])) as requested(trigger_key)
    left join public.organization_risk_trigger_rules rule
      on rule.organization_id = target_case.organization_id
      and rule.trigger_key = requested.trigger_key
    where rule.trigger_key is null
  ) then
    raise exception 'Unconfigured non-monetary risk trigger';
  end if;
  select * into target_client from public.clients where id = target_case.client_id;
  select * into risk_profile from public.client_risk_profiles
  where client_id = target_case.client_id and status = 'approved';

  target_exposure := target_basic_tax + target_surcharge + target_interest;
  if risk_profile.id is null then
    derived_tier := 'medium';
  else
    medium_amount := case risk_profile.materiality_basis
      when 'fixed_peso' then risk_profile.medium_boundary
      else risk_profile.basis_amount * risk_profile.medium_boundary / 100
    end;
    high_amount := case risk_profile.materiality_basis
      when 'fixed_peso' then risk_profile.high_boundary
      else risk_profile.basis_amount * risk_profile.high_boundary / 100
    end;
    derived_tier := case
      when target_exposure >= high_amount then 'high'
      when target_exposure >= medium_amount then 'medium'
      else 'low'
    end;
  end if;

  select rule.minimum_tier into trigger_tier
  from public.organization_risk_trigger_rules rule
  where rule.organization_id = target_case.organization_id
    and rule.trigger_key = any(coalesce(target_triggers, '{}'::text[]))
  order by private.risk_rank(rule.minimum_tier) desc
  limit 1;
  if private.risk_rank(trigger_tier) > private.risk_rank(derived_tier) then
    derived_tier := trigger_tier;
  end if;

  final_tier := coalesce(nullif(requested_tier, ''), derived_tier);
  if private.risk_rank(final_tier) < private.risk_rank(derived_tier) then
    raise exception 'Risk tier cannot be lower than the control-derived tier';
  end if;

  select * into current_assessment from public.case_risk_assessments
  where case_id = target_case_id and status in ('pending', 'approved')
  order by created_at desc limit 1;

  if current_assessment.id is not null
    and private.risk_rank(final_tier) < private.risk_rank(current_assessment.final_tier) then
    if nullif(trim(target_justification), '') is null then
      raise exception 'Lowering a risk tier requires written justification';
    end if;
    if actor <> target_client.cluster_leader_id
      and not private.has_org_role(target_case.organization_id, array['hod', 'super_admin']) then
      raise exception 'Only the client Cluster Leader or HOD may lower risk';
    end if;
  end if;

  update public.case_risk_assessments set status = 'superseded'
  where case_id = target_case_id and status = 'pending';

  insert into public.case_risk_assessments (
    organization_id, case_id, client_risk_profile_id, basic_tax, surcharge, interest,
    exposure_rating, non_monetary_triggers, calculated_tier, final_tier,
    change_justification, external_counsel_required, created_by
  ) values (
    target_case.organization_id, target_case_id, risk_profile.id,
    target_basic_tax, target_surcharge, target_interest,
    case when risk_profile.id is null then 'unrated' else 'rated' end,
    coalesce(target_triggers, '{}'::text[]), derived_tier, final_tier,
    nullif(trim(target_justification), ''), target_external_counsel_required, actor
  ) returning id into new_assessment_id;

  perform private.write_control_audit(
    target_case.organization_id, target_case.client_id, target_case_id, 'case_risk_assessed',
    jsonb_build_object(
      'assessment_id', new_assessment_id,
      'exposure_rating', case when risk_profile.id is null then 'unrated' else 'rated' end,
      'tier', final_tier
    )
  );
  return new_assessment_id;
end;
$$;

create or replace function public.approve_case_risk_assessment(target_assessment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  assessment public.case_risk_assessments%rowtype;
  target_case public.audit_cases%rowtype;
  target_client public.clients%rowtype;
begin
  select * into assessment from public.case_risk_assessments where id = target_assessment_id;
  if assessment.id is null or assessment.status <> 'pending' then raise exception 'Pending assessment not found'; end if;
  if actor = assessment.created_by then raise exception 'Nobody may approve their own work'; end if;
  select * into target_case from public.audit_cases where id = assessment.case_id;
  select * into target_client from public.clients where id = target_case.client_id;

  if assessment.final_tier = 'low'
    and not private.has_org_role(assessment.organization_id, array['tax_supervisor', 'hod', 'super_admin']) then
    raise exception 'Low-risk cases require Tax Supervisor approval';
  elsif assessment.final_tier = 'medium'
    and actor <> target_client.cluster_leader_id
    and not private.has_org_role(assessment.organization_id, array['hod', 'super_admin']) then
    raise exception 'Medium-risk cases require the client Cluster Leader';
  elsif assessment.final_tier = 'high'
    and not private.has_org_role(assessment.organization_id, array['hod', 'super_admin']) then
    raise exception 'High-risk cases require HOD approval';
  end if;

  update public.case_risk_assessments
  set status = 'superseded'
  where case_id = assessment.case_id and status = 'approved';

  update public.case_risk_assessments
  set status = 'approved', approved_by = actor, approved_at = now()
  where id = target_assessment_id;

  perform private.write_control_audit(
    assessment.organization_id, target_case.client_id, assessment.case_id, 'case_risk_approved',
    jsonb_build_object('assessment_id', target_assessment_id, 'tier', assessment.final_tier)
  );
end;
$$;

alter table public.organization_member_roles enable row level security;
alter table public.clients enable row level security;
alter table public.case_assignments enable row level security;
alter table public.control_audit_log enable row level security;
alter table public.client_risk_profiles enable row level security;
alter table public.organization_risk_trigger_rules enable row level security;
alter table public.case_risk_assessments enable row level security;

create policy "member_roles_select_tax_leads" on public.organization_member_roles
  for select to authenticated using (
    user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'system_admin', 'super_admin'])
  );

create policy "clients_select_tax_team" on public.clients
  for select to authenticated using (private.can_access_client(id));
create policy "clients_insert_tax_leads" on public.clients
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  );
create policy "clients_update_tax_leads" on public.clients
  for update to authenticated using (
    private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  ) with check (
    private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  );

create policy "case_assignments_select_case" on public.case_assignments
  for select to authenticated using (private.can_access_case(case_id));
create policy "case_assignments_insert_supervisor" on public.case_assignments
  for insert to authenticated with check (
    assigned_by = (select auth.uid())
    and private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  );
create policy "case_assignments_update_supervisor" on public.case_assignments
  for update to authenticated using (
    private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  ) with check (
    private.has_org_role(organization_id, array['tax_supervisor', 'hod', 'super_admin'])
  );

create policy "control_audit_select_authorized" on public.control_audit_log
  for select to authenticated using (
    (case_id is not null and private.can_access_case(case_id))
    or (case_id is null and client_id is not null and private.can_access_client(client_id))
    or (case_id is null and client_id is null and private.has_org_role(
      organization_id, array['tax_supervisor', 'hod', 'system_admin', 'super_admin']
    ))
  );
create policy "client_risk_profiles_select_tax_team" on public.client_risk_profiles
  for select to authenticated using (private.can_access_client(client_id));
create policy "risk_trigger_rules_select_tax_team" on public.organization_risk_trigger_rules
  for select to authenticated using (private.has_org_role(
    organization_id, array['junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'super_admin']
  ));
create policy "case_risk_assessments_select_case" on public.case_risk_assessments
  for select to authenticated using (private.can_access_case(case_id));

drop policy if exists "cases_select_member" on public.audit_cases;
drop policy if exists "cases_insert_member" on public.audit_cases;
drop policy if exists "cases_update_member" on public.audit_cases;
create policy "cases_select_authorized" on public.audit_cases
  for select to authenticated using (private.can_access_case(id));
create policy "cases_insert_tax_team" on public.audit_cases
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and private.has_org_role(
      organization_id, array['junior', 'senior', 'tax_supervisor', 'cluster_leader', 'hod', 'super_admin']
    )
  );
create policy "cases_update_authorized" on public.audit_cases
  for update to authenticated using (private.can_access_case(id))
  with check (private.can_access_case(id));

drop policy if exists "checklist_select_member" on public.case_checklist;
drop policy if exists "checklist_update_member" on public.case_checklist;
create policy "checklist_select_authorized" on public.case_checklist
  for select to authenticated using (private.can_access_case(case_id));
create policy "checklist_update_authorized" on public.case_checklist
  for update to authenticated using (private.can_access_case(case_id))
  with check (private.can_access_case(case_id));

drop policy if exists "events_select_member" on public.case_events;
create policy "events_select_authorized" on public.case_events
  for select to authenticated using (private.can_access_case(case_id));

grant select on public.organization_member_roles to authenticated;
grant select, insert, update on public.clients to authenticated;
grant select, insert, update on public.case_assignments to authenticated;
grant select on public.control_audit_log to authenticated;
grant select on public.client_risk_profiles to authenticated;
grant select on public.organization_risk_trigger_rules to authenticated;
grant select on public.case_risk_assessments to authenticated;

revoke all on function private.can_access_client(uuid) from public;
revoke all on function private.can_access_case(uuid) from public;
revoke all on function private.write_control_audit(uuid, uuid, uuid, text, jsonb) from public;
revoke all on function private.case_action_allowed(uuid, text) from public;
revoke all on function public.can_perform_case_action(uuid, text) from public;
revoke all on function public.can_perform_case_action(uuid, text) from anon;
revoke all on function public.set_member_role(uuid, uuid, text, boolean) from public;
revoke all on function public.set_member_role(uuid, uuid, text, boolean) from anon;
revoke all on function public.set_risk_trigger_rule(uuid, text, text) from public;
revoke all on function public.set_risk_trigger_rule(uuid, text, text) from anon;
revoke all on function public.propose_client_risk_profile(uuid, text, numeric, numeric, numeric) from public;
revoke all on function public.propose_client_risk_profile(uuid, text, numeric, numeric, numeric) from anon;
revoke all on function public.approve_client_risk_profile(uuid) from public;
revoke all on function public.approve_client_risk_profile(uuid) from anon;
revoke all on function public.record_case_risk_assessment(uuid, numeric, numeric, numeric, text[], text, text, boolean) from public;
revoke all on function public.record_case_risk_assessment(uuid, numeric, numeric, numeric, text[], text, text, boolean) from anon;
revoke all on function public.approve_case_risk_assessment(uuid) from public;
revoke all on function public.approve_case_risk_assessment(uuid) from anon;

grant execute on function private.can_access_client(uuid) to authenticated;
grant execute on function private.can_access_case(uuid) to authenticated;
grant execute on function public.can_perform_case_action(uuid, text) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.set_risk_trigger_rule(uuid, text, text) to authenticated;
grant execute on function public.propose_client_risk_profile(uuid, text, numeric, numeric, numeric) to authenticated;
grant execute on function public.approve_client_risk_profile(uuid) to authenticated;
grant execute on function public.record_case_risk_assessment(uuid, numeric, numeric, numeric, text[], text, text, boolean) to authenticated;
grant execute on function public.approve_case_risk_assessment(uuid) to authenticated;
