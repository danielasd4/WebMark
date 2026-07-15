-- WebMark — Schema Limpo v1.0
-- Execute este arquivo no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ngsrmetqfesecscdshco/sql

-- ─── Extensions ───────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────
do $$ begin
  create type plan_type as enum ('start', 'essencial', 'pro', 'business', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_status as enum ('active', 'inactive', 'lead', 'customer', 'unsubscribed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type automation_status as enum ('active', 'inactive', 'draft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_event_type as enum ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'spam');
exception when duplicate_object then null; end $$;

-- ─── Organizations ────────────────────────────────────
create table if not exists organizations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  owner_id      uuid references auth.users(id) on delete cascade,
  plan          plan_type not null default 'start',
  sends_used    integer not null default 0,
  sends_limit   integer not null default 1000,
  logo_url      text,
  website       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists organization_members (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ─── Contacts ─────────────────────────────────────────
create table if not exists contacts (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name      text not null,
  last_name       text,
  email           text not null,
  phone           text,
  whatsapp        text,
  company         text,
  job_title       text,
  city            text,
  state           text,
  country         text default 'Brasil',
  website         text,
  instagram       text,
  linkedin        text,
  tags            text[] default '{}',
  notes           text,
  source          text,
  status          contact_status not null default 'active',
  assigned_to     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, email)
);

create index if not exists contacts_org_id_idx on contacts(organization_id);
create index if not exists contacts_email_idx on contacts(email);
create index if not exists contacts_tags_idx on contacts using gin(tags);

-- ─── Contact Lists ────────────────────────────────────
create table if not exists contact_lists (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists contact_list_members (
  list_id    uuid not null references contact_lists(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (list_id, contact_id)
);

-- ─── Campaigns ────────────────────────────────────────
create table if not exists campaigns (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  subject         text not null,
  preview_text    text,
  from_name       text not null,
  from_email      text not null,
  reply_to        text,
  content_html    text not null default '',
  content_json    jsonb,
  status          campaign_status not null default 'draft',
  list_ids        uuid[],
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists campaigns_org_id_idx on campaigns(organization_id);

create table if not exists campaign_stats (
  campaign_id     uuid primary key references campaigns(id) on delete cascade,
  total_sent      integer not null default 0,
  delivered       integer not null default 0,
  opens           integer not null default 0,
  unique_opens    integer not null default 0,
  clicks          integer not null default 0,
  unique_clicks   integer not null default 0,
  bounces         integer not null default 0,
  unsubscribes    integer not null default 0,
  spam_complaints integer not null default 0,
  updated_at      timestamptz not null default now()
);

-- ─── Email Events ─────────────────────────────────────
create table if not exists email_events (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id     uuid references campaigns(id) on delete cascade,
  contact_id      uuid references contacts(id) on delete cascade,
  event_type      email_event_type not null,
  metadata        jsonb,
  occurred_at     timestamptz not null default now()
);

-- ─── Automations ──────────────────────────────────────
create table if not exists automations (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  trigger_type    text not null,
  trigger_config  jsonb,
  steps           jsonb not null default '[]',
  status          automation_status not null default 'draft',
  enrolled_count  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table contacts enable row level security;
alter table contact_lists enable row level security;
alter table contact_list_members enable row level security;
alter table campaigns enable row level security;
alter table campaign_stats enable row level security;
alter table email_events enable row level security;
alter table automations enable row level security;

-- Helper function
create or replace function get_user_org_id()
returns uuid language sql security definer as $$
  select organization_id from organization_members where user_id = auth.uid() limit 1;
$$;

-- Organizations
drop policy if exists "org_select" on organizations;
drop policy if exists "org_owner_all" on organizations;
create policy "org_select" on organizations for select using (id = get_user_org_id());
create policy "org_owner_all" on organizations for all using (owner_id = auth.uid());

-- Contacts
drop policy if exists "contacts_select" on contacts;
drop policy if exists "contacts_all" on contacts;
create policy "contacts_select" on contacts for select using (organization_id = get_user_org_id());
create policy "contacts_all" on contacts for all using (organization_id = get_user_org_id());

-- Lists
drop policy if exists "lists_select" on contact_lists;
drop policy if exists "lists_all" on contact_lists;
create policy "lists_select" on contact_lists for select using (organization_id = get_user_org_id());
create policy "lists_all" on contact_lists for all using (organization_id = get_user_org_id());

-- Contact list members
drop policy if exists "list_members_select" on contact_list_members;
drop policy if exists "list_members_all" on contact_list_members;
create policy "list_members_select" on contact_list_members for select
  using (exists (select 1 from contact_lists cl where cl.id = list_id and cl.organization_id = get_user_org_id()));
create policy "list_members_all" on contact_list_members for all
  using (exists (select 1 from contact_lists cl where cl.id = list_id and cl.organization_id = get_user_org_id()));

-- Campaigns
drop policy if exists "campaigns_select" on campaigns;
drop policy if exists "campaigns_all" on campaigns;
create policy "campaigns_select" on campaigns for select using (organization_id = get_user_org_id());
create policy "campaigns_all" on campaigns for all using (organization_id = get_user_org_id());

-- Campaign stats
drop policy if exists "stats_select" on campaign_stats;
create policy "stats_select" on campaign_stats for select
  using (exists (select 1 from campaigns c where c.id = campaign_id and c.organization_id = get_user_org_id()));

-- Automations
drop policy if exists "automations_select" on automations;
drop policy if exists "automations_all" on automations;
create policy "automations_select" on automations for select using (organization_id = get_user_org_id());
create policy "automations_all" on automations for all using (organization_id = get_user_org_id());

-- Email events (read only)
drop policy if exists "events_select" on email_events;
create policy "events_select" on email_events for select using (organization_id = get_user_org_id());

-- ─── Auto-create org on signup ────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_org_id uuid;
  org_slug   text;
begin
  org_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'company_name', 'empresa'),
    '[^a-z0-9]', '-', 'g'
  )) || '-' || substring(new.id::text, 1, 8);

  insert into organizations (name, slug, owner_id, plan, sends_limit)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    org_slug, new.id, 'start', 1000
  )
  returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── updated_at triggers ──────────────────────────────
create or replace function update_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_ts on organizations;
drop trigger if exists set_ts on contacts;
drop trigger if exists set_ts on contact_lists;
drop trigger if exists set_ts on campaigns;

create trigger set_ts before update on organizations for each row execute procedure update_updated_at();
create trigger set_ts before update on contacts for each row execute procedure update_updated_at();
create trigger set_ts before update on contact_lists for each row execute procedure update_updated_at();
create trigger set_ts before update on campaigns for each row execute procedure update_updated_at();
