-- Additive mobile onboarding only. Web functions and legacy profile writes stay unchanged.
alter table public.policy_acceptances drop constraint policy_acceptances_source_check;
alter table public.policy_acceptances add constraint policy_acceptances_source_check
  check (source in ('web_registration', 'web_profile_completion', 'mobile_registration', 'mobile_profile_completion'));

create function public.record_mobile_policy_acceptance(
  terms_accepted boolean, privacy_accepted boolean,
  terms_version text, privacy_version text, registration_source text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  profile_id uuid;
begin
  if auth.uid() is null or terms_accepted is distinct from true or privacy_accepted is distinct from true then
    raise exception 'Please read and accept both policies.';
  end if;
  if registration_source is null or registration_source not in ('mobile_registration', 'mobile_profile_completion') then
    raise exception 'Invalid registration source.';
  end if;
  -- Reuse the same authoritative revisions; do not create a second policy registry.
  perform 1 from public.web_registration_policies order by policy_id for share;
  if terms_version is distinct from (select version from public.web_registration_policies where policy_id = 'terms')
     or privacy_version is distinct from (select version from public.web_registration_policies where policy_id = 'privacy') then
    raise exception 'The policies have changed. Update the app, review the current policies, and accept them again.';
  end if;
  select id into profile_id from public.users
    where user_id = auth.uid() and not coalesce(is_suspended, false) and mobile_number is not null;
  if profile_id is null then raise exception 'Complete your profile before recording acceptance.'; end if;
  insert into public.policy_acceptances (user_id, policy_id, policy_version, source)
    values (profile_id, 'terms', terms_version, registration_source),
           (profile_id, 'privacy', privacy_version, registration_source)
    on conflict (user_id, policy_id, policy_version) do nothing;
end;
$$;
revoke all on function public.record_mobile_policy_acceptance(boolean, boolean, text, text, text) from public, anon;
grant execute on function public.record_mobile_policy_acceptance(boolean, boolean, text, text, text) to authenticated;

create function public.complete_mobile_registration(
  profile_details jsonb, requested_role text,
  terms_accepted boolean, privacy_accepted boolean,
  terms_version text, privacy_version text, registration_source text,
  expected_auth_id uuid
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  caller uuid := auth.uid();
  profile public.users%rowtype;
  details public.users%rowtype;
  canonical_email text := auth.jwt()->>'email';
begin
  if caller is null or caller is distinct from expected_auth_id then raise exception 'Unauthorized.'; end if;
  if requested_role is null or requested_role not in ('tenant', 'landlord') then
    raise exception 'Please choose a valid account type.';
  end if;
  if terms_accepted is distinct from true or privacy_accepted is distinct from true then
    raise exception 'Please read and accept both policies.';
  end if;
  if registration_source is null or registration_source not in ('mobile_registration', 'mobile_profile_completion') then
    raise exception 'Invalid registration source.';
  end if;
  if terms_version is distinct from (select version from public.web_registration_policies where policy_id = 'terms')
     or privacy_version is distinct from (select version from public.web_registration_policies where policy_id = 'privacy') then
    raise exception 'The policies have changed. Update the app, review the current policies, and accept them again.';
  end if;
  if jsonb_typeof(profile_details) is distinct from 'object' then raise exception 'Invalid profile details.'; end if;
  if exists (select 1 from jsonb_object_keys(profile_details) as field(name)
    where name not in ('first_name', 'last_name', 'middle_name', 'suffix', 'gender', 'mobile_number',
      'birth_date', 'street_address', 'barangay', 'city', 'province', 'postal_code')) then
    raise exception 'Only registration profile fields may be submitted.';
  end if;
  -- Same account lock as web: even a profile-less cross-platform retry serializes.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 0));
  if coalesce((public.get_my_suspension_status()->>'suspended')::boolean, false) then
    raise exception 'This account is suspended.';
  end if;
  select * into profile from public.users where user_id = caller for update;
  if found then
    -- Mobile permits held consumer roles on mixed accounts, never admin-only access.
    if not (profile.roles && array['tenant', 'landlord']::text[]) then
      raise exception 'Admin accounts are available on the web portal only.';
    end if;
    if profile.mobile_number is not null or profile.account_status <> 'unverified' then
      -- Only replay a completed mobile registration; never enroll a legacy account.
      if requested_role = any(profile.roles) and (select count(*) from public.policy_acceptances
        where user_id = profile.id and source in ('mobile_registration', 'mobile_profile_completion')
          and ((policy_id = 'terms' and policy_version = terms_version)
            or (policy_id = 'privacy' and policy_version = privacy_version))) = 2 then
        return profile.id;
      end if;
      raise exception 'Profile setup is no longer available for this account.';
    end if;
    if not (requested_role = any(profile.roles)) and cardinality(profile.roles) <> 1 then
      raise exception 'Cannot change the role of this account during onboarding.';
    end if;
  end if;
  details := jsonb_populate_record(null::public.users, profile_details);
  if nullif(btrim(details.first_name), '') is null or nullif(btrim(details.last_name), '') is null
     or details.mobile_number is null or details.birth_date is null or details.gender is null
     or nullif(btrim(details.street_address), '') is null or nullif(btrim(details.barangay), '') is null
     or nullif(btrim(details.city), '') is null or nullif(btrim(details.province), '') is null
     or details.postal_code is null then raise exception 'Complete all required profile fields.'; end if;
  if profile.id is null then
    if nullif(canonical_email, '') is null then raise exception 'Could not verify your email.'; end if;
    insert into public.users (user_id, email, roles, first_name, last_name, middle_name, suffix,
      gender, mobile_number, birth_date, street_address, barangay, city, province, postal_code)
    values (caller, canonical_email, array[requested_role], details.first_name, details.last_name,
      details.middle_name, details.suffix, details.gender, details.mobile_number, details.birth_date,
      details.street_address, details.barangay, details.city, details.province, details.postal_code)
    returning * into profile;
  else
    if not (requested_role = any(profile.roles)) then
      perform public.set_onboarding_role(requested_role);
    end if;
    update public.users set first_name = details.first_name, last_name = details.last_name,
      middle_name = details.middle_name, suffix = details.suffix, gender = details.gender,
      mobile_number = details.mobile_number, birth_date = details.birth_date,
      street_address = details.street_address, barangay = details.barangay,
      city = details.city, province = details.province, postal_code = details.postal_code
    where id = profile.id;
  end if;
  perform public.record_mobile_policy_acceptance(terms_accepted, privacy_accepted,
    terms_version, privacy_version, registration_source);
  return profile.id;
end;
$$;
revoke all on function public.complete_mobile_registration(jsonb, text, boolean, boolean, text, text, text, uuid) from public, anon;
grant execute on function public.complete_mobile_registration(jsonb, text, boolean, boolean, text, text, text, uuid) to authenticated;
