-- Push token removal (public.unregister_push_token).
-- Covers 20261105130000_unregister_push_token.sql: the app releases the device
-- token from its SIGNED_OUT handler, after the session ended, so the RPC must
-- work for `anon`, remove only the given token and refuse malformed input.
--
-- Run in an isolated test database or transaction (rolls back). Requires pgtap.
-- Never run this against production records: it inserts fixture users and tokens.
begin;
set local app.suppress_push_delivery = 'true';
select plan(8);

create temporary table token_fixture as
  select gen_random_uuid() owner_auth;
grant select on token_fixture to anon, authenticated, service_role;

insert into auth.users(id) select owner_auth from token_fixture;

insert into public.push_tokens (user_id, token, platform)
select u.id, t.token, 'android'
from public.users u
cross join (values
  ('ExponentPushToken[signed-out-device]'),
  ('ExponentPushToken[other-device]')
) as t(token)
where u.user_id = (select owner_auth from token_fixture);

select has_function('public', 'unregister_push_token', array['text'],
  'unregister_push_token(text) exists');

select ok(has_function_privilege('anon', 'public.unregister_push_token(text)', 'execute'),
  'anon can release a token after sign-out');

select ok(has_function_privilege('authenticated', 'public.unregister_push_token(text)', 'execute'),
  'authenticated can release a token while the push preference is turned off');

set local role anon;

select lives_ok(
  $$select public.unregister_push_token('ExponentPushToken[signed-out-device]')$$,
  'a signed-out caller can release the device token');

reset role;

select is(
  (select count(*)::int from public.push_tokens where token = 'ExponentPushToken[signed-out-device]'),
  0,
  'the released token is gone');

select is(
  (select count(*)::int from public.push_tokens where token = 'ExponentPushToken[other-device]'),
  1,
  'other tokens are untouched');

set local role anon;

select throws_ok(
  $$select public.unregister_push_token('not-a-token')$$,
  '22023',
  'Invalid push token',
  'a malformed token is rejected');

reset role;
set local role authenticated;

select lives_ok(
  $$select public.unregister_push_token('ExponentPushToken[never-registered]')$$,
  'releasing an unknown token is a quiet no-op');

reset role;
select * from finish();
rollback;
