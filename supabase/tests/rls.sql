-- Run against a disposable/local Supabase database after migrations.
-- The transaction proves ownership at the database boundary, not through UI behavior.
begin;

insert into auth.users (
  instance_id, id, aud, role, email, phone, encrypted_password,
  email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'rls-a@example.test', '989120000001', crypt('Test-password-1', gen_salt('bf')), now(), now(), '{}',
   '{"first_name":"کاربر","last_name":"آزمایشی الف","email":"rls-a@example.test","terms_accepted":true,"privacy_accepted":true}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'rls-b@example.test', '989120000002', crypt('Test-password-2', gen_salt('bf')), now(), now(), '{}',
   '{"first_name":"کاربر","last_name":"آزمایشی ب","email":"rls-b@example.test","terms_accepted":true,"privacy_accepted":true}', now(), now());

update public.profiles set is_active = true, phone_verified_at = now();

do $$
begin
  if (select phone from public.profiles where id = '11111111-1111-4111-8111-111111111111') <> '+989120000001' then
    raise exception 'signup trigger did not restore E.164 plus prefix';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
declare own_count integer;
declare foreign_count integer;
declare changed_count integer;
begin
  select count(*) into own_count
  from public.profiles
  where id = '11111111-1111-4111-8111-111111111111';
  select count(*) into foreign_count
  from public.profiles
  where id = '22222222-2222-4222-8222-222222222222';
  if own_count <> 1 or foreign_count <> 0 then
    raise exception 'RLS FAILURE: profile ownership visibility is incorrect';
  end if;

  update public.profiles
  set first_name = 'forbidden update'
  where id = '22222222-2222-4222-8222-222222222222';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'RLS FAILURE: another user profile was directly writable';
  end if;
end;
$$;

insert into public.marketing_plans (
  id, user_id, plan_fingerprint, business_name, title, input_data, output_data
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'fingerprint-user-a', 'A', 'Plan A', '{}', '{}'
);

insert into public.product_events (plan_id, event_name, metadata)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'plan_viewed', '{}');

do $$
begin
  begin
    insert into public.marketing_plans (
      user_id, plan_fingerprint, business_name, title, input_data, output_data
    ) values (
      '22222222-2222-4222-8222-222222222222',
      'forbidden-cross-user-insert', 'B', 'Plan B', '{}', '{}'
    );
    raise exception 'RLS FAILURE: cross-user insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

do $$
declare visible_count integer;
begin
  select count(*) into visible_count
  from public.marketing_plans
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if visible_count <> 0 then
    raise exception 'RLS FAILURE: another user plan was directly readable';
  end if;
end;
$$;

do $$
declare visible_count integer;
begin
  select count(*) into visible_count
  from public.product_events
  where plan_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if visible_count <> 0 then
    raise exception 'RLS FAILURE: another user event was directly readable';
  end if;

  begin
    insert into public.product_events (user_id, event_name, metadata)
    values ('11111111-1111-4111-8111-111111111111', 'login', '{}');
    raise exception 'RLS FAILURE: cross-user event insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
declare changed_count integer;
begin
  update public.marketing_plans
  set title = 'forbidden update'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'RLS FAILURE: another user plan was directly writable';
  end if;
end;
$$;

reset role;

set local role anon;
do $$
begin
  begin
    perform 1 from public.profiles limit 1;
    raise exception 'RLS FAILURE: anonymous profile read unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.marketing_plans limit 1;
    raise exception 'RLS FAILURE: anonymous plan read unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.product_events limit 1;
    raise exception 'RLS FAILURE: anonymous event read unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
rollback;
