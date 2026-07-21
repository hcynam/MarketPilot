-- MarketPilot account, lead-profile, plan persistence and product-event schema.
-- Apply with the Supabase CLI or SQL editor after Auth phone login is configured.

create extension if not exists citext;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 2 and 80),
  last_name text not null check (char_length(btrim(last_name)) between 2 and 100),
  email citext not null unique check (char_length(email::text) <= 254),
  phone text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  phone_verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz,
  last_active_at timestamptz,
  login_count integer not null default 0 check (login_count >= 0),
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  locale text not null default 'fa-IR' check (char_length(locale) between 2 and 24),
  timezone text check (timezone is null or char_length(timezone) between 2 and 80),
  landing_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  signup_reason text not null default 'header_account'
    check (signup_reason in ('pdf', 'word', 'print', 'save', 'header_account', 'dashboard')),
  is_active boolean not null default false
);

create table if not exists public.marketing_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_id text,
  plan_fingerprint text not null check (char_length(plan_fingerprint) between 8 and 128),
  business_name text not null check (char_length(btrim(business_name)) between 1 and 200),
  title text not null check (char_length(btrim(title)) between 1 and 240),
  input_data jsonb not null check (jsonb_typeof(input_data) = 'object'),
  output_data jsonb not null check (jsonb_typeof(output_data) = 'object'),
  schema_version text not null default 'marketing-plan.v1',
  model_provider text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_viewed_at timestamptz,
  status text not null default 'ready' check (status in ('generating', 'ready', 'failed')),
  origin text not null default 'authenticated' check (origin in ('guest', 'authenticated', 'imported')),
  export_context jsonb not null default '{}'::jsonb check (jsonb_typeof(export_context) = 'object'),
  constraint marketing_plans_user_fingerprint_key unique (user_id, plan_fingerprint)
);

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid references public.marketing_plans(id) on delete set null,
  event_name text not null check (event_name in (
    'signup_completed', 'login', 'plan_generated', 'plan_saved',
    'plan_viewed', 'pdf_exported', 'word_exported', 'printed'
  )),
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 4096
  ),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketing_plans_user_updated_idx
  on public.marketing_plans (user_id, updated_at desc);
create index if not exists marketing_plans_user_viewed_idx
  on public.marketing_plans (user_id, last_viewed_at desc nulls last);
create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at desc);
create index if not exists product_events_name_created_idx
  on public.product_events (event_name, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists marketing_plans_set_updated_at on public.marketing_plans;
create trigger marketing_plans_set_updated_at
before update on public.marketing_plans
for each row execute function public.set_updated_at();

create or replace function public.handle_marketpilot_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  accepted_at timestamptz := timezone('utc', now());
begin
  if coalesce((metadata ->> 'terms_accepted')::boolean, false) is not true
     or coalesce((metadata ->> 'privacy_accepted')::boolean, false) is not true then
    raise exception using errcode = '23514', message = 'required_consents_missing';
  end if;

  insert into public.profiles (
    id, first_name, last_name, email, phone,
    terms_accepted_at, privacy_accepted_at,
    marketing_consent, marketing_consent_at,
    locale, timezone, landing_page, referrer,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    signup_reason, is_active
  ) values (
    new.id,
    btrim(metadata ->> 'first_name'),
    btrim(metadata ->> 'last_name'),
    lower(btrim(metadata ->> 'email')),
    new.phone,
    accepted_at,
    accepted_at,
    coalesce((metadata ->> 'marketing_consent')::boolean, false),
    case when coalesce((metadata ->> 'marketing_consent')::boolean, false) then accepted_at end,
    coalesce(nullif(metadata ->> 'locale', ''), 'fa-IR'),
    nullif(metadata ->> 'timezone', ''),
    nullif(metadata ->> 'landing_page', ''),
    nullif(metadata ->> 'referrer', ''),
    nullif(metadata ->> 'utm_source', ''),
    nullif(metadata ->> 'utm_medium', ''),
    nullif(metadata ->> 'utm_campaign', ''),
    nullif(metadata ->> 'utm_content', ''),
    nullif(metadata ->> 'utm_term', ''),
    coalesce(nullif(metadata ->> 'signup_reason', ''), 'header_account'),
    false
  );
  return new;
end;
$$;

drop trigger if exists on_marketpilot_auth_user_created on auth.users;
create trigger on_marketpilot_auth_user_created
after insert on auth.users
for each row execute function public.handle_marketpilot_user_created();

create or replace function public.record_authenticated_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.profiles
  set last_login_at = timezone('utc', now()),
      last_active_at = timezone('utc', now()),
      login_count = login_count + 1
  where id = auth.uid() and is_active is true;
end;
$$;

create or replace function public.confirm_phone_change(new_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if new_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_phone'; end if;
  if not exists (
    select 1 from auth.users
    where id = auth.uid() and phone = new_phone and phone_confirmed_at is not null
  ) then
    raise exception 'phone_not_verified';
  end if;
  update public.profiles
  set phone = new_phone, phone_verified_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

revoke all on function public.record_authenticated_login() from public;
revoke all on function public.confirm_phone_change(text) from public;
grant execute on function public.record_authenticated_login() to authenticated;
grant execute on function public.confirm_phone_change(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.marketing_plans enable row level security;
alter table public.product_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists plans_select_own on public.marketing_plans;
create policy plans_select_own on public.marketing_plans
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists plans_insert_own on public.marketing_plans;
create policy plans_insert_own on public.marketing_plans
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists plans_update_own on public.marketing_plans;
create policy plans_update_own on public.marketing_plans
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists plans_delete_own on public.marketing_plans;
create policy plans_delete_own on public.marketing_plans
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists events_insert_own on public.product_events;
create policy events_insert_own on public.product_events
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    plan_id is null
    or exists (
      select 1 from public.marketing_plans owned_plan
      where owned_plan.id = plan_id and owned_plan.user_id = (select auth.uid())
    )
  )
);

drop policy if exists events_select_own on public.product_events;
create policy events_select_own on public.product_events
for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.profiles from anon;
revoke all on public.marketing_plans from anon;
revoke all on public.product_events from anon;

grant select on public.profiles to authenticated;
grant update (first_name, last_name, marketing_consent, marketing_consent_at, last_active_at, updated_at)
  on public.profiles to authenticated;
grant select, insert, update, delete on public.marketing_plans to authenticated;
grant select, insert on public.product_events to authenticated;
grant usage, select on sequence public.product_events_id_seq to authenticated;

comment on table public.profiles is 'Verified MarketPilot user profile and first-touch lead context; passwords and OTP values never live here.';
comment on table public.marketing_plans is 'Structured marketing plans regenerated into exports; RLS limits every row to its owner.';
comment on table public.product_events is 'Minimal authenticated product events without passwords, OTPs, or plan payloads.';
