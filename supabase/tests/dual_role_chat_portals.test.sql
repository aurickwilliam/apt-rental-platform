-- One portal per person for chats with no apartment (public.get_portal_conversations,
-- app_private.chat_inquirer_portal and the recipientPortal in notify_chat_message /
-- notify_chat_reaction), from 20261102020631_dual_role_chat_portals.sql.
--
-- Run in an isolated test database or transaction (rolls back). Requires pgtap.
-- Never run this against production records: it inserts fixture users, an
-- apartment, chat messages and a reaction. Push delivery is suppressed for the
-- transaction with the operator switch from 20260924101500.
begin;
set local app.suppress_push_delivery = 'true';
select plan(16);

create temporary table portal_fixture as
  select gen_random_uuid() a_auth, gen_random_uuid() b_auth, gen_random_uuid() c_auth,
    gen_random_uuid() apt_id;
grant select on portal_fixture to anon, authenticated, service_role;

insert into auth.users(id)
  select a_auth from portal_fixture union all
  select b_auth from portal_fixture union all
  select c_auth from portal_fixture;

-- A and B hold both roles; C is a tenant who has chatted about B's apartment.
update public.users set roles = '{tenant,landlord}', account_status = 'verified',
  first_name = 'Alex', last_name = 'Dual', mobile_number = '+639171234601',
  preferences = '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb
  where user_id = (select a_auth from portal_fixture);
update public.users set roles = '{tenant,landlord}', account_status = 'verified',
  first_name = 'Bea', last_name = 'Dual', mobile_number = '+639171234602',
  preferences = '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb
  where user_id = (select b_auth from portal_fixture);
update public.users set roles = '{tenant}', account_status = 'verified',
  first_name = 'Cy', last_name = 'Tenant', mobile_number = '+639171234603',
  preferences = '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb
  where user_id = (select c_auth from portal_fixture);

create temporary table portal_ids as
  select (select id from public.users where user_id = a_auth) a_id,
    (select id from public.users where user_id = b_auth) b_id,
    (select id from public.users where user_id = c_auth) c_id,
    apt_id
  from portal_fixture;
grant select on portal_ids to anon, authenticated, service_role;

insert into public.apartments (id, landlord_id, name, description, monthly_rent, type,
  street_address, barangay, city, province, latitude, longitude, status, no_bedrooms,
  no_bathrooms, area_sqm, is_verified, rent_due_day, is_hidden_by_admin)
  select apt_id, b_id, 'Portal Test Unit', 'Fixture unit', 12000, 'Apartment',
    '1 Test Street', 'Barangay 1', 'Caloocan', 'Metro Manila', 14.7478621715, 121.04306224066,
    'available', 1, 1, 30, false, 5, false
  from portal_ids;

-- A opens a general inquiry with B (no apartment); C asks B about B's apartment.
-- created_at is the wall clock, not the transaction start, so the messages keep
-- their order (the portal rule follows the first message).
create function pg_temp.say(p_sender uuid, p_receiver uuid, p_apartment uuid, p_message text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.chat (sender_id, receiver_id, apartment_id, message, message_type, created_at)
  values (p_sender, p_receiver, p_apartment, p_message, 'text', clock_timestamp())
  returning id into v_id;
  return v_id;
end;
$$;

select pg_temp.say((select a_id from portal_ids), (select b_id from portal_ids), null, 'Hi, are you renting out anything?');
select pg_temp.say((select b_id from portal_ids), (select a_id from portal_ids), null, 'Yes, take a look at my listing.');
select pg_temp.say((select c_id from portal_ids), (select b_id from portal_ids), (select apt_id from portal_ids), 'Is the unit still free?');

-- The notification for the first message names the receiver's (landlord) portal;
-- the reply goes back to the inquirer's (tenant) portal; an apartment chat has none.
select is(
  (select n.data->>'recipientPortal' from public.notifications n
   where n.user_id = (select b_id from portal_ids) and n.type = 'message'
     and n.data->>'senderId' = (select a_id::text from portal_ids) and n.data->'apartmentId' = 'null'::jsonb
   order by n.created_at limit 1),
  'landlord', 'a first message with no apartment is addressed to the receiver''s landlord portal');
select is(
  (select n.data->>'recipientPortal' from public.notifications n
   where n.user_id = (select a_id from portal_ids) and n.type = 'message'
     and n.data->>'senderId' = (select b_id::text from portal_ids)
   order by n.created_at limit 1),
  'tenant', 'the reply is addressed to the inquirer''s tenant portal');
select is(
  (select count(*)::int from public.notifications n
   where n.user_id = (select b_id from portal_ids) and n.data ? 'recipientPortal'
     and n.data->>'apartmentId' = (select apt_id::text from portal_ids)),
  0, 'a chat about an apartment carries no explicit portal');

-- Reaction by B on A's first message (A is the author, thread has no apartment).
select pg_temp.say((select a_id from portal_ids), (select b_id from portal_ids), null, 'Thanks!');
insert into public.chat_reactions (message_id, user_id, emoji)
  select c.id, (select b_id from portal_ids), '👍'
  from public.chat c
  where c.sender_id = (select a_id from portal_ids) and c.message = 'Thanks!';
select is(
  (select n.data->>'recipientPortal' from public.notifications n
   where n.user_id = (select a_id from portal_ids) and n.data->>'event' = 'reaction'
   order by n.created_at desc limit 1),
  'tenant', 'a reaction in a no-apartment chat goes to the author''s portal by the same rule');

-- ─── get_portal_conversations ───────────────────────────────────────────────
create function pg_temp.portal_keys(p_auth uuid, p_portal text)
returns text[] language plpgsql as $$
declare v_keys text[];
begin
  perform set_config('request.jwt.claim.sub', p_auth::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_auth, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select coalesce(array_agg(r.conversation_key order by r.conversation_key), '{}')
  into v_keys from public.get_portal_conversations(p_portal) r;
  reset role;
  return v_keys;
end;
$$;

create function pg_temp.key(p_one uuid, p_two uuid, p_apartment uuid)
returns text language sql as $$
  select 'chat:' || coalesce(p_apartment::text, 'none') || ':' ||
    least(p_one::text, p_two::text) || ':' || greatest(p_one::text, p_two::text);
$$;

-- A started the no-apartment chat: tenant portal only.
select ok(
  pg_temp.key((select a_id from portal_ids), (select b_id from portal_ids), null)
    = any(pg_temp.portal_keys((select a_auth from portal_fixture), 'tenant')),
  'the inquirer sees the no-apartment chat in the tenant portal');
select ok(
  not (pg_temp.key((select a_id from portal_ids), (select b_id from portal_ids), null)
    = any(pg_temp.portal_keys((select a_auth from portal_fixture), 'landlord'))),
  'the inquirer does not see it in the landlord portal');
-- B received it: landlord portal only.
select ok(
  pg_temp.key((select a_id from portal_ids), (select b_id from portal_ids), null)
    = any(pg_temp.portal_keys((select b_auth from portal_fixture), 'landlord')),
  'the other person sees the no-apartment chat in the landlord portal');
select ok(
  not (pg_temp.key((select a_id from portal_ids), (select b_id from portal_ids), null)
    = any(pg_temp.portal_keys((select b_auth from portal_fixture), 'tenant'))),
  'the other person does not see it in the tenant portal');
-- The apartment chat is unchanged: B owns the apartment, so landlord portal only.
select ok(
  pg_temp.key((select b_id from portal_ids), (select c_id from portal_ids), (select apt_id from portal_ids))
    = any(pg_temp.portal_keys((select b_auth from portal_fixture), 'landlord')),
  'an apartment chat stays in the owner''s landlord portal');
select ok(
  not (pg_temp.key((select b_id from portal_ids), (select c_id from portal_ids), (select apt_id from portal_ids))
    = any(pg_temp.portal_keys((select b_auth from portal_fixture), 'tenant'))),
  'an apartment chat is not in the owner''s tenant portal');
select ok(
  pg_temp.key((select b_id from portal_ids), (select c_id from portal_ids), (select apt_id from portal_ids))
    = any(pg_temp.portal_keys((select c_auth from portal_fixture), 'tenant')),
  'the asking tenant sees the apartment chat in the tenant portal');
select is(
  cardinality(pg_temp.portal_keys((select c_auth from portal_fixture), 'landlord')), 0,
  'a tenant-only account has nothing in the landlord portal');

-- Counting: A's two portals together hold the chat exactly once.
select is(
  cardinality(pg_temp.portal_keys((select a_auth from portal_fixture), 'tenant'))
    + cardinality(pg_temp.portal_keys((select a_auth from portal_fixture), 'landlord')),
  1, 'the no-apartment chat appears in exactly one of the inquirer''s portals');
select is(
  cardinality(pg_temp.portal_keys((select b_auth from portal_fixture), 'tenant'))
    + cardinality(pg_temp.portal_keys((select b_auth from portal_fixture), 'landlord')),
  2, 'each of the other person''s chats appears in exactly one portal');

-- The helper is not callable by clients.
select ok(
  not has_function_privilege('authenticated', 'app_private.chat_inquirer_portal(uuid,uuid,uuid)', 'execute'),
  'clients cannot call the portal helper');
select ok(
  not has_function_privilege('anon', 'app_private.chat_inquirer_portal(uuid,uuid,uuid)', 'execute'),
  'signed-out visitors cannot call the portal helper');

select * from finish();
rollback;
