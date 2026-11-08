create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'reviewer', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.audit_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  client_reference text not null check (char_length(client_reference) between 2 and 120),
  notice_type text not null check (notice_type in ('loa', 'nod', 'nic', 'pan', 'fan', 'other')),
  received_date date not null,
  stage text not null default 'intake' check (stage in ('intake', 'records', 'review', 'response', 'submitted', 'closed')),
  deadline_status text not null default 'unconfirmed' check (deadline_status = 'unconfirmed'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audit_cases_organization_updated_idx
  on public.audit_cases (organization_id, updated_at desc);

create table public.case_checklist (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.audit_cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 240),
  status text not null default 'outstanding' check (status in ('outstanding', 'available', 'missing', 'professional_help')),
  position smallint not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, position)
);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.audit_cases(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('case_created', 'case_updated', 'checklist_updated')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index case_events_case_created_idx
  on public.case_events (case_id, created_at desc);

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_org_owner(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_owner(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.audit_cases enable row level security;
alter table public.case_checklist enable row level security;
alter table public.case_events enable row level security;

create policy "profiles_select_self" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "organizations_select_member" on public.organizations
  for select to authenticated using (public.is_org_member(id));
create policy "organizations_update_owner" on public.organizations
  for update to authenticated using (public.is_org_owner(id)) with check (public.is_org_owner(id));

create policy "memberships_select_self" on public.organization_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy "cases_select_member" on public.audit_cases
  for select to authenticated using (public.is_org_member(organization_id));
create policy "cases_insert_member" on public.audit_cases
  for insert to authenticated with check (
    public.is_org_member(organization_id) and created_by = (select auth.uid())
  );
create policy "cases_update_member" on public.audit_cases
  for update to authenticated using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "checklist_select_member" on public.case_checklist
  for select to authenticated using (public.is_org_member(organization_id));
create policy "checklist_update_member" on public.case_checklist
  for update to authenticated using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "events_select_member" on public.case_events
  for select to authenticated using (public.is_org_member(organization_id));

grant select, update on public.profiles to authenticated;
grant select, update on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select, insert, update on public.audit_cases to authenticated;
grant select, update on public.case_checklist to authenticated;
grant select on public.case_events to authenticated;

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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_case_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id or new.created_by <> old.created_by then
    raise exception 'Case ownership fields cannot be changed';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger protect_case_identity_before_update
  before update on public.audit_cases
  for each row execute function public.protect_case_identity();

create or replace function public.initialize_case()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.case_checklist (case_id, organization_id, label, position)
  values
    (new.id, new.organization_id, 'Original notice and all attachments', 1),
    (new.id, new.organization_id, 'Envelope, email, or proof of receipt', 2),
    (new.id, new.organization_id, 'Books, returns, and source records requested', 3),
    (new.id, new.organization_id, 'Professional deadline confirmation', 4);

  insert into public.case_events (case_id, organization_id, actor_id, event_type)
  values (new.id, new.organization_id, new.created_by, 'case_created');
  return new;
end;
$$;

create trigger initialize_case_after_insert
  after insert on public.audit_cases
  for each row execute function public.initialize_case();

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
    case when new.stage is distinct from old.stage then 'stage' end
  ], null);

  if cardinality(changed_fields) > 0 then
    insert into public.case_events (case_id, organization_id, actor_id, event_type, details)
    values (new.id, new.organization_id, (select auth.uid()), 'case_updated', jsonb_build_object('changed_fields', changed_fields));
  end if;
  return new;
end;
$$;

create trigger log_case_update_after_update
  after update on public.audit_cases
  for each row execute function public.log_case_update();

create or replace function public.protect_and_log_checklist_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.case_id <> old.case_id or new.organization_id <> old.organization_id or new.label <> old.label or new.position <> old.position then
    raise exception 'Checklist ownership and definition fields cannot be changed';
  end if;
  new.updated_at = now();

  if new.status is distinct from old.status then
    insert into public.case_events (case_id, organization_id, actor_id, event_type, details)
    values (
      new.case_id,
      new.organization_id,
      (select auth.uid()),
      'checklist_updated',
      jsonb_build_object('item_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger protect_and_log_checklist_before_update
  before update on public.case_checklist
  for each row execute function public.protect_and_log_checklist_update();

revoke all on function public.handle_new_user() from public;
revoke all on function public.protect_case_identity() from public;
revoke all on function public.initialize_case() from public;
revoke all on function public.log_case_update() from public;
revoke all on function public.protect_and_log_checklist_update() from public;
