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
    case
      when new.phone ~ '^[1-9][0-9]{7,14}$' then '+' || new.phone
      else new.phone
    end,
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
