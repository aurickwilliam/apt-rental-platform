-- Chat reaction notifications (public.notify_chat_reaction).
-- Covers the producer added in 20261017090635_chat_reaction_notifications.sql:
-- recipient selection, self-reaction and non-participant suppression, cooldown,
-- emoji replacement/deletion, muted conversations, blocks, preview shapes and
-- the deep-link payload.
--
-- Run in an isolated test database or transaction (rolls back). Requires pgtap.
-- Never run this against production records: it inserts fixture users, chat
-- messages and reactions. Push delivery is suppressed for the transaction with
-- the operator switch from 20260924101500_allow_operator_suppression_of_push_delivery.
begin;
set local app.suppress_push_delivery = 'true';
select plan(29);

create temporary table reaction_fixture as
  select gen_random_uuid() author_auth, gen_random_uuid() actor_auth,
    gen_random_uuid() outsider_auth;
grant select on reaction_fixture to anon, authenticated, service_role;

insert into auth.users(id)
  select author_auth from reaction_fixture union all
  select actor_auth from reaction_fixture union all
  select outsider_auth from reaction_fixture;

-- handle_new_user auto-created the rows; shape them into a landlord and two
-- tenants (tenant rows keep non-null preferences, landlord rows stay NULL).
update public.users set roles = '{landlord}', account_status = 'verified',
  first_name = 'Ryan', last_name = 'Gosling', mobile_number = '+639171234501',
  preferences = null
  where user_id = (select author_auth from reaction_fixture);
update public.users set roles = '{tenant}', account_status = 'verified',
  first_name = 'Emma', last_name = 'Stone', mobile_number = '+639171234502',
  preferences = '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb
  where user_id = (select actor_auth from reaction_fixture);
update public.users set roles = '{tenant}', account_status = 'verified',
  first_name = 'Out', last_name = 'Sider', mobile_number = '+639171234503',
  preferences = '{"selectedCities": ["Caloocan"], "budgetMin": 5000, "budgetMax": 14999, "bedroomCount": "1-2 Bedrooms"}'::jsonb
  where user_id = (select outsider_auth from reaction_fixture);

create temporary table reaction_ids as
  select (select id from public.users where user_id = author_auth) author_id,
    (select id from public.users where user_id = actor_auth) actor_id,
    (select id from public.users where user_id = outsider_auth) outsider_id
  from reaction_fixture;
grant select on reaction_ids to anon, authenticated, service_role;

-- Fixtures: authors react as `author_id`, everyone else as `actor_id`.
create function pg_temp.make_message(
  p_sender uuid, p_receiver uuid, p_message text, p_type text default 'text'
) returns uuid language plpgsql as $$
declare
  v_id uuid;
begin
  insert into public.chat (sender_id, receiver_id, apartment_id, message, message_type)
  values (p_sender, p_receiver, null, p_message, p_type)
  returning id into v_id;
  return v_id;
end;
$$;

-- Mirrors the client upsert: an existing row is UPDATEd, never deleted.
create function pg_temp.set_reaction(p_message uuid, p_user uuid, p_emoji text)
returns void language plpgsql as $$
begin
  insert into public.chat_reactions (message_id, user_id, emoji)
  values (p_message, p_user, p_emoji)
  on conflict (message_id, user_id) do update set emoji = excluded.emoji;
end;
$$;

create function pg_temp.clear_reaction(p_message uuid, p_user uuid)
returns void language plpgsql as $$
begin
  delete from public.chat_reactions
  where message_id = p_message and user_id = p_user;
end;
$$;

create function pg_temp.reaction_rows(p_recipient uuid, p_message uuid)
returns integer language sql as $$
  select count(*)::int
  from public.notifications n
  where n.user_id = p_recipient
    and n.data->>'event' = 'reaction'
    and n.data->>'messageId' = p_message::text;
$$;

create function pg_temp.reaction_field(p_recipient uuid, p_message uuid, p_field text)
returns text language sql as $$
  select case p_field
    when 'type' then n.type
    when 'title' then n.title
    when 'message' then n.message
    when 'preview' then n.data->>'messagePreview'
    when 'emoji' then n.data->>'emoji'
    when 'screen' then n.data->>'screen'
    when 'senderId' then n.data->>'senderId'
    when 'conversationKey' then n.data->>'conversationKey'
    else null
  end
  from public.notifications n
  where n.user_id = p_recipient
    and n.data->>'event' = 'reaction'
    and n.data->>'messageId' = p_message::text
  order by n.created_at desc, n.id
  limit 1;
$$;

create function pg_temp.set_muted(p_user uuid, p_other uuid, p_muted boolean)
returns void language plpgsql as $$
begin
  update public.conversation_preferences
  set is_muted = p_muted
  where user_id = p_user and other_user_id = p_other and apartment_id is null;

  insert into public.conversation_preferences (user_id, other_user_id, apartment_id, is_muted)
  select p_user, p_other, null, p_muted
  where not exists (
    select 1 from public.conversation_preferences
    where user_id = p_user and other_user_id = p_other and apartment_id is null
  );
end;
$$;

-- ─── A. First eligible reaction ─────────────────────────────────────────────
create temporary table scenario_ids (
  label text primary key,
  message_id uuid not null
);
grant select on scenario_ids to anon, authenticated, service_role;

insert into scenario_ids(label, message_id)
  select 'first', pg_temp.make_message(author_id, actor_id, 'Hello')
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'self', pg_temp.make_message(actor_id, author_id, 'My own note')
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'image', pg_temp.make_message(author_id, actor_id, null, 'image')
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'long', pg_temp.make_message(author_id, actor_id,
    E'First line\nsecond ' || repeat('word ', 40))
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'empty', pg_temp.make_message(author_id, actor_id, '')
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'muted', pg_temp.make_message(author_id, actor_id, 'Muted thread')
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'blocked_by_author', pg_temp.make_message(author_id, actor_id, 'Blocked by author')
  from reaction_ids;
insert into scenario_ids(label, message_id)
  select 'blocked_by_actor', pg_temp.make_message(author_id, actor_id, 'Blocked by actor')
  from reaction_ids;

select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select actor_id from reaction_ids),
  '❤️'
);

select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  1, 'the message author receives one reaction notification');
select is(
  (select pg_temp.reaction_rows(actor_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  0, 'the reacting user is never the recipient');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'type') from reaction_ids, scenario_ids where label = 'first'),
  'message', 'the existing message notification type is reused');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'title') from reaction_ids, scenario_ids where label = 'first'),
  'Emma Stone', 'the title is the reacting user display name');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'message') from reaction_ids, scenario_ids where label = 'first'),
  'Reacted ❤️ to your message', 'the body names the emoji');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'emoji') from reaction_ids, scenario_ids where label = 'first'),
  '❤️', 'the payload carries the emoji');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'preview') from reaction_ids, scenario_ids where label = 'first'),
  'Hello', 'the payload carries the reacted-to message preview');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'screen') from reaction_ids, scenario_ids where label = 'first'),
  'chat', 'the deep-link screen is chat');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'conversationKey') from reaction_ids, scenario_ids where label = 'first'),
  (select 'chat:none:' || least(author_id::text, actor_id::text) || ':' || greatest(author_id::text, actor_id::text) from reaction_ids),
  'the conversation key uses sorted participant ids');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'senderId') from reaction_ids, scenario_ids where label = 'first'),
  (select actor_id::text from reaction_ids),
  'the payload carries the reacting user id');

-- A non-participant reaction must not notify anyone, even though the cooldown
-- key (recipient + message + reactor) would not suppress it.
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select outsider_id from reaction_ids),
  '👍'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  1, 'a reaction from a non-participant adds no notification');

-- ─── B. Emoji replacement and removal ───────────────────────────────────────
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select actor_id from reaction_ids),
  '👍'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  1, 'replacing the emoji creates no new notification');

select pg_temp.clear_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select actor_id from reaction_ids)
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  1, 'removing the reaction creates no new notification');

-- ─── C. Cooldown ────────────────────────────────────────────────────────────
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  1, 're-adding a reaction inside the cooldown window is suppressed');

update public.notifications set created_at = now() - interval '20 minutes'
where data->>'event' = 'reaction' and data->>'messageId' = (
  select message_id::text from scenario_ids where label = 'first'
);

select pg_temp.clear_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select actor_id from reaction_ids)
);
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'first'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'first'),
  2, 'a reaction after the cooldown window notifies again');

-- ─── D. Self-reaction ───────────────────────────────────────────────────────
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'self'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(actor_id, message_id) from reaction_ids, scenario_ids where label = 'self'),
  0, 'reacting to your own message notifies nobody');
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'self'),
  0, 'the other party is not notified about a self-reaction');

-- ─── E. Image message ───────────────────────────────────────────────────────
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'image'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'image'),
  1, 'an image message produces a reaction notification');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'preview') from reaction_ids, scenario_ids where label = 'image'),
  'Sent an image', 'image messages use the safe placeholder preview');

-- ─── F. Long text ───────────────────────────────────────────────────────────
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'long'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'long'),
  1, 'a long text message still produces one notification');
select is(
  (select length(pg_temp.reaction_field(author_id, message_id, 'preview')) from reaction_ids, scenario_ids where label = 'long'),
  120, 'a long preview is truncated to 120 characters');
select is(
  (select position(E'\n' in pg_temp.reaction_field(author_id, message_id, 'preview')) from reaction_ids, scenario_ids where label = 'long'),
  0, 'the preview is collapsed to a single line');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'preview') from reaction_ids, scenario_ids where label = 'long'),
  'First line second ' || left(repeat('word ', 40), 120 - length('First line second ')),
  'collapsed whitespace is preserved in order');

-- ─── G. Empty text ──────────────────────────────────────────────────────────
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'empty'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'empty'),
  1, 'an empty text message still produces one notification');
select is(
  (select pg_temp.reaction_field(author_id, message_id, 'preview') from reaction_ids, scenario_ids where label = 'empty'),
  null, 'an empty preview is omitted from the payload');

-- ─── H. Muted conversation ──────────────────────────────────────────────────
select pg_temp.set_muted(
  (select author_id from reaction_ids),
  (select actor_id from reaction_ids),
  true
);
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'muted'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'muted'),
  0, 'a muted conversation produces no reaction notification');

-- ─── I. Blocks (both directions) ────────────────────────────────────────────
insert into public.user_blocks (blocker_id, blocked_id)
  select author_id, actor_id from reaction_ids;
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'blocked_by_author'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'blocked_by_author'),
  0, 'a block by the author suppresses the reaction notification');

delete from public.user_blocks
where blocker_id = (select author_id from reaction_ids)
  and blocked_id = (select actor_id from reaction_ids);

insert into public.user_blocks (blocker_id, blocked_id)
  select actor_id, author_id from reaction_ids;
select pg_temp.set_reaction(
  (select message_id from scenario_ids where label = 'blocked_by_actor'),
  (select actor_id from reaction_ids),
  '❤️'
);
select is(
  (select pg_temp.reaction_rows(author_id, message_id) from reaction_ids, scenario_ids where label = 'blocked_by_actor'),
  0, 'a block by the reacting user suppresses the reaction notification');

-- ─── J. Recipient invariant ─────────────────────────────────────────────────
select is(
  (select count(*)::int
   from public.notifications n
   where n.data->>'event' = 'reaction'
     and n.user_id = (select actor_id from reaction_ids)),
  0, 'no reaction notification is ever addressed to the reacting user');

select * from finish();
rollback;
