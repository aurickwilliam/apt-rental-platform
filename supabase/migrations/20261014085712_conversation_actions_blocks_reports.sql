-- Messages list actions: per-user conversation preferences (pin, archive,
-- mute, mark unread), user blocks (messaging only) and user reports with
-- admin review.
--
-- Clients never write these tables directly: every change goes through a
-- caller-bound SECURITY DEFINER RPC that resolves the caller from auth.uid()
-- (non-suspended) and validates the other participant. RLS lets owners read
-- their own preference/block rows and admins read reports.

-- ---------------------------------------------------------------------------
-- 1. Conversation preferences
-- ---------------------------------------------------------------------------

create table if not exists public.conversation_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  other_user_id uuid not null references public.users (id) on delete cascade,
  apartment_id uuid references public.apartments (id) on delete cascade,
  is_pinned boolean not null default false,
  pinned_at timestamptz,
  is_archived boolean not null default false,
  is_muted boolean not null default false,
  marked_unread boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint conversation_preferences_not_self check (user_id <> other_user_id)
);

-- One row per (owner, other user, apartment|none) conversation.
create unique index if not exists conversation_preferences_conversation_key
  on public.conversation_preferences (
    user_id,
    other_user_id,
    coalesce(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index if not exists conversation_preferences_other_user_id_idx
  on public.conversation_preferences (other_user_id);
create index if not exists conversation_preferences_apartment_id_idx
  on public.conversation_preferences (apartment_id);

alter table public.conversation_preferences enable row level security;

drop policy if exists "Owners read own conversation preferences" on public.conversation_preferences;
create policy "Owners read own conversation preferences"
  on public.conversation_preferences for select to authenticated
  using (user_id = (select id from public.users where user_id = (select auth.uid())));

drop policy if exists "Active accounts only" on public.conversation_preferences;
create policy "Active accounts only" on public.conversation_preferences as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

revoke all on table public.conversation_preferences from anon, authenticated;
grant select on table public.conversation_preferences to authenticated;

-- Caller's internal users.id (active accounts only).
create or replace function app_private.current_active_user_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select u.id from public.users u
  where u.user_id = (select auth.uid()) and not u.is_suspended;
$$;
revoke all on function app_private.current_active_user_id() from public, anon;
grant execute on function app_private.current_active_user_id() to authenticated;

-- Whether the two users have exchanged a message in this conversation.
create or replace function app_private.conversation_exists(
  p_user_id uuid, p_other_user_id uuid, p_apartment_id uuid
)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.chat c
    where ((c.sender_id = p_user_id and c.receiver_id = p_other_user_id)
        or (c.sender_id = p_other_user_id and c.receiver_id = p_user_id))
      and c.apartment_id is not distinct from p_apartment_id
  );
$$;
revoke all on function app_private.conversation_exists(uuid, uuid, uuid) from public, anon, authenticated;

-- Changes the caller's preferences for one conversation. A null argument
-- leaves that preference unchanged. Archiving unpins; pinning unarchives.
create or replace function public.set_conversation_preference(
  p_other_user_id uuid,
  p_apartment_id uuid,
  p_pinned boolean default null,
  p_archived boolean default null,
  p_muted boolean default null,
  p_marked_unread boolean default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
  v_pinned boolean := p_pinned;
  v_archived boolean := p_archived;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_other_user_id is null or p_other_user_id = v_user_id
      or not app_private.conversation_exists(v_user_id, p_other_user_id, p_apartment_id) then
    raise exception 'Conversation not found.' using errcode = '22023';
  end if;

  if v_archived is true then v_pinned := false; end if;
  if v_pinned is true then v_archived := false; end if;

  insert into public.conversation_preferences as cp (
    user_id, other_user_id, apartment_id,
    is_pinned, pinned_at, is_archived, is_muted, marked_unread
  )
  values (
    v_user_id, p_other_user_id, p_apartment_id,
    coalesce(v_pinned, false),
    case when v_pinned is true then now() end,
    coalesce(v_archived, false),
    coalesce(p_muted, false),
    coalesce(p_marked_unread, false)
  )
  on conflict (
    user_id,
    other_user_id,
    coalesce(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  do update set
    is_pinned = coalesce(v_pinned, cp.is_pinned),
    pinned_at = case
      when v_pinned is true and not cp.is_pinned then now()
      when v_pinned is false then null
      else cp.pinned_at
    end,
    is_archived = coalesce(v_archived, cp.is_archived),
    is_muted = coalesce(p_muted, cp.is_muted),
    marked_unread = coalesce(p_marked_unread, cp.marked_unread),
    updated_at = now();
end;
$$;
revoke all on function public.set_conversation_preference(uuid, uuid, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_conversation_preference(uuid, uuid, boolean, boolean, boolean, boolean) to authenticated;

-- Marks every message the other user sent the caller in this conversation as
-- read and clears a manual "mark unread".
create or replace function public.mark_conversation_read(
  p_other_user_id uuid,
  p_apartment_id uuid
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  update public.chat
  set is_read = true, read_at = coalesce(read_at, now())
  where receiver_id = v_user_id
    and sender_id = p_other_user_id
    and apartment_id is not distinct from p_apartment_id
    and is_read = false;

  update public.conversation_preferences
  set marked_unread = false, updated_at = now()
  where user_id = v_user_id
    and other_user_id = p_other_user_id
    and apartment_id is not distinct from p_apartment_id
    and marked_unread;
end;
$$;
revoke all on function public.mark_conversation_read(uuid, uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid, uuid) to authenticated;

-- A new message brings an archived conversation back for both participants
-- (Messenger-style).
create or replace function public.unarchive_conversation_on_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversation_preferences
  set is_archived = false, updated_at = now()
  where is_archived
    and apartment_id is not distinct from NEW.apartment_id
    and ((user_id = NEW.sender_id and other_user_id = NEW.receiver_id)
      or (user_id = NEW.receiver_id and other_user_id = NEW.sender_id));
  return NEW;
end;
$$;
revoke all on function public.unarchive_conversation_on_message() from public, anon, authenticated;
drop trigger if exists unarchive_conversation_on_message on public.chat;
create trigger unarchive_conversation_on_message
  after insert on public.chat
  for each row execute function public.unarchive_conversation_on_message();

-- Muted conversations create no notification (no feed row, no push). The rest
-- of the body is the live definition at the time of writing.
create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sender_name text;
  v_sender_avatar text;
  v_preview text;
begin
  if exists (
    select 1 from public.conversation_preferences cp
    where cp.user_id = NEW.receiver_id
      and cp.other_user_id = NEW.sender_id
      and cp.apartment_id is not distinct from NEW.apartment_id
      and cp.is_muted
  ) then
    return NEW;
  end if;

  select
    trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')),
    u.avatar_url
  into v_sender_name, v_sender_avatar
  from public.users u
  where u.id = NEW.sender_id;

  v_preview := case
    when NEW.message is not null then NEW.message
    when NEW.message_type = 'image' then 'Sent an image'
    when NEW.message_type = 'video' then 'Sent a video'
    when NEW.message_type = 'gif' then 'Sent a GIF'
    else 'Sent an attachment'
  end;

  perform public.create_notification(
    NEW.receiver_id,
    'message',
    coalesce(nullif(v_sender_name, ''), 'New Message'),
    v_preview,
    jsonb_build_object(
      'screen', 'chat',
      'apartmentId', NEW.apartment_id,
      'conversationKey',
        'chat:' || coalesce(NEW.apartment_id::text, 'none') || ':' ||
        least(NEW.sender_id::text, NEW.receiver_id::text) || ':' ||
        greatest(NEW.sender_id::text, NEW.receiver_id::text),
      'senderId', NEW.sender_id,
      'senderAvatarUrl', v_sender_avatar
    )
  );

  return NEW;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. User blocks (messaging only)
-- ---------------------------------------------------------------------------

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Blockers read own blocks" on public.user_blocks;
create policy "Blockers read own blocks"
  on public.user_blocks for select to authenticated
  using (blocker_id = (select id from public.users where user_id = (select auth.uid())));

drop policy if exists "Active accounts only" on public.user_blocks;
create policy "Active accounts only" on public.user_blocks as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

revoke all on table public.user_blocks from anon, authenticated;
grant select on table public.user_blocks to authenticated;

create or replace function public.block_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_user_id is null or p_user_id = v_user_id
      or not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'This person can''t be blocked.' using errcode = '22023';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_user_id, p_user_id)
  on conflict do nothing;
end;
$$;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  delete from public.user_blocks where blocker_id = v_user_id and blocked_id = p_user_id;
end;
$$;
revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;

-- Block state between the caller and one other user, in both directions.
create or replace function public.get_block_status(p_other_user_id uuid)
returns table (blocked_by_me boolean, blocked_me boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  return query select
    exists (select 1 from public.user_blocks b
      where b.blocker_id = v_user_id and b.blocked_id = p_other_user_id),
    exists (select 1 from public.user_blocks b
      where b.blocker_id = p_other_user_id and b.blocked_id = v_user_id);
end;
$$;
revoke all on function public.get_block_status(uuid) from public, anon;
grant execute on function public.get_block_status(uuid) to authenticated;

-- No new messages in either direction while a block exists. The message is
-- user-facing and does not reveal who blocked whom.
create or replace function public.guard_chat_blocks()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = NEW.sender_id and b.blocked_id = NEW.receiver_id)
       or (b.blocker_id = NEW.receiver_id and b.blocked_id = NEW.sender_id)
  ) then
    raise exception 'You can''t send messages in this conversation.' using errcode = 'P0001';
  end if;
  return NEW;
end;
$$;
revoke all on function public.guard_chat_blocks() from public, anon, authenticated;
drop trigger if exists guard_chat_blocks on public.chat;
create trigger guard_chat_blocks
  before insert on public.chat
  for each row execute function public.guard_chat_blocks();

-- ---------------------------------------------------------------------------
-- 3. User reports + admin review
-- ---------------------------------------------------------------------------

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  reported_user_id uuid not null references public.users (id) on delete cascade,
  apartment_id uuid references public.apartments (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  resolution_note text,
  resolved_by uuid references public.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_reports_not_self check (reporter_id <> reported_user_id),
  constraint user_reports_reason_check check (
    reason in ('spam', 'scam', 'harassment', 'inappropriate', 'fake_profile', 'other')
  ),
  constraint user_reports_details_length check (details is null or char_length(details) <= 1000),
  constraint user_reports_status_check check (status in ('open', 'resolved', 'dismissed'))
);

-- One open report per reporter and reported user.
create unique index if not exists user_reports_one_open_per_pair
  on public.user_reports (reporter_id, reported_user_id) where status = 'open';
create index if not exists user_reports_status_created_at_idx
  on public.user_reports (status, created_at desc);
create index if not exists user_reports_reported_user_id_idx on public.user_reports (reported_user_id);
create index if not exists user_reports_apartment_id_idx on public.user_reports (apartment_id);
create index if not exists user_reports_resolved_by_idx on public.user_reports (resolved_by);

alter table public.user_reports enable row level security;

drop policy if exists "Admins read user reports" on public.user_reports;
create policy "Admins read user reports"
  on public.user_reports for select to authenticated
  using ((select private.is_admin()));

drop policy if exists "Active accounts only" on public.user_reports;
create policy "Active accounts only" on public.user_reports as restrictive
  for all to authenticated
  using ((select app_private.is_active_user()))
  with check ((select app_private.is_active_user()));

revoke all on table public.user_reports from anon, authenticated;
grant select on table public.user_reports to authenticated;

-- Files a report about someone the caller has chatted with.
create or replace function public.report_user(
  p_reported_user_id uuid,
  p_apartment_id uuid,
  p_reason text,
  p_details text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := app_private.current_active_user_id();
  v_details text := nullif(btrim(coalesce(p_details, '')), '');
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;
  if p_reported_user_id is null or p_reported_user_id = v_user_id
      or not app_private.conversation_exists(v_user_id, p_reported_user_id, p_apartment_id) then
    raise exception 'You can only report people you have messaged.' using errcode = '22023';
  end if;
  if p_reason not in ('spam', 'scam', 'harassment', 'inappropriate', 'fake_profile', 'other') then
    raise exception 'Choose a reason for your report.' using errcode = '22023';
  end if;
  if p_reason = 'other' and v_details is null then
    raise exception 'Tell us what happened.' using errcode = '22023';
  end if;
  if char_length(coalesce(v_details, '')) > 1000 then
    raise exception 'Keep the details under 1000 characters.' using errcode = '22023';
  end if;

  begin
    insert into public.user_reports (reporter_id, reported_user_id, apartment_id, reason, details)
    values (v_user_id, p_reported_user_id, p_apartment_id, p_reason, v_details);
  exception when unique_violation then
    raise exception 'You already reported this person. Our team is reviewing it.' using errcode = 'P0001';
  end;
end;
$$;
revoke all on function public.report_user(uuid, uuid, text, text) from public, anon;
grant execute on function public.report_user(uuid, uuid, text, text) to authenticated;

alter table public.admin_audit_logs drop constraint if exists admin_audit_logs_action_check;
alter table public.admin_audit_logs add constraint admin_audit_logs_action_check check (
  action = any (array[
    'USER_VERIFICATION_APPROVED', 'USER_VERIFICATION_REJECTED',
    'PROPERTY_VERIFICATION_APPROVED', 'PROPERTY_VERIFICATION_REJECTED',
    'USER_SUSPENDED', 'USER_REACTIVATED',
    'APARTMENT_HIDDEN', 'APARTMENT_RESTORED',
    'PASSPORT_DOCUMENT_APPROVED', 'PASSPORT_DOCUMENT_REJECTED',
    'USER_REPORT_RESOLVED', 'USER_REPORT_DISMISSED'
  ])
);

-- Admin-only: closes an open report and writes the audit row (targeting the
-- reported user so Activity links to their account).
create or replace function public.admin_resolve_user_report(
  p_report_id uuid,
  p_status text,
  p_note text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_admin_id uuid;
  v_report public.user_reports%rowtype;
begin
  if p_note is null or length(btrim(p_note)) < 3 or length(p_note) > 500 then
    raise exception 'A note between 3 and 500 characters is required.';
  end if;
  if p_status not in ('resolved', 'dismissed') then
    raise exception 'Invalid report decision.';
  end if;
  select id into v_admin_id from public.users
    where user_id = (select auth.uid()) and 'admin' = any(roles) and not is_suspended;
  if v_admin_id is null then raise exception 'Admin access required.'; end if;

  select * into v_report from public.user_reports where id = p_report_id for update;
  if not found or v_report.status <> 'open' then
    raise exception 'This report is no longer open.';
  end if;

  update public.user_reports
  set status = p_status, resolution_note = btrim(p_note),
      resolved_by = v_admin_id, resolved_at = now()
  where id = p_report_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, reason)
  values (
    v_admin_id,
    case when p_status = 'resolved' then 'USER_REPORT_RESOLVED' else 'USER_REPORT_DISMISSED' end,
    'user', v_report.reported_user_id, btrim(p_note)
  );
end;
$$;
revoke all on function public.admin_resolve_user_report(uuid, text, text) from public, anon;
grant execute on function public.admin_resolve_user_report(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Conversation list: include the caller's preferences and own blocks
-- ---------------------------------------------------------------------------
-- The return type changes, so the function is dropped and recreated. Body is
-- unchanged apart from the joined preference/block columns.

drop function if exists public.get_portal_conversations(text);

create function public.get_portal_conversations(p_portal text)
returns table(
  conversation_key text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_phone text,
  apartment_id uuid,
  apartment_name text,
  last_message text,
  last_message_time timestamp with time zone,
  unread_count integer,
  last_sender_id uuid,
  last_message_type text,
  conversation_type text,
  is_pinned boolean,
  pinned_at timestamp with time zone,
  is_archived boolean,
  is_muted boolean,
  marked_unread boolean,
  blocked_by_me boolean
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
begin
  if p_portal is null or p_portal not in ('tenant', 'landlord') then
    raise exception 'Portal must be tenant or landlord.'
      using errcode = '22023';
  end if;

  select u.id into v_user_id
  from public.users u
  where u.user_id = auth.uid() and not u.is_suspended;

  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  return query
  with conversations as (
    select
      case when c.sender_id = v_user_id then c.receiver_id else c.sender_id end as other_user_id,
      c.apartment_id,
      c.created_at,
      c.id,
      c.message,
      c.message_type,
      c.sender_id
    from public.chat c
    where c.sender_id = v_user_id or c.receiver_id = v_user_id
  ),
  latest as (
    select distinct on (co.other_user_id, co.apartment_id)
      co.other_user_id,
      co.apartment_id,
      co.created_at,
      co.id,
      co.message,
      co.message_type,
      co.sender_id
    from conversations co
    order by co.other_user_id, co.apartment_id, co.created_at desc, co.id desc
  ),
  unread as (
    select
      case when c.sender_id = v_user_id then c.receiver_id else c.sender_id end as other_user_id,
      c.apartment_id,
      count(*) filter (where c.receiver_id = v_user_id and c.is_read = false)::integer as unread_count
    from public.chat c
    where c.sender_id = v_user_id or c.receiver_id = v_user_id
    group by 1, 2
  )
  select
    'chat:'
      || coalesce(l.apartment_id::text, 'none')
      || ':' || least(l.other_user_id::text, v_user_id::text)
      || ':' || greatest(l.other_user_id::text, v_user_id::text) as conversation_key,
    l.other_user_id,
    trim(both from coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) as other_user_name,
    u.avatar_url as other_user_avatar,
    u.mobile_number as other_user_phone,
    l.apartment_id,
    a.name as apartment_name,
    l.message as last_message,
    l.created_at as last_message_time,
    un.unread_count,
    l.sender_id as last_sender_id,
    l.message_type as last_message_type,
    case
      when exists (
        select 1
        from public.tenancies t
        where t.landlord_id = v_user_id
          and t.tenant_id = l.other_user_id
          and t.apartment_id = l.apartment_id
          and t.status = 'active'
      ) then 'tenant'
      else 'inquiry'
    end as conversation_type,
    coalesce(cp.is_pinned, false) as is_pinned,
    cp.pinned_at,
    coalesce(cp.is_archived, false) as is_archived,
    coalesce(cp.is_muted, false) as is_muted,
    coalesce(cp.marked_unread, false) as marked_unread,
    exists (
      select 1 from public.user_blocks b
      where b.blocker_id = v_user_id and b.blocked_id = l.other_user_id
    ) as blocked_by_me
  from latest l
  left join public.users u on u.id = l.other_user_id
  left join public.apartments a on a.id = l.apartment_id
  left join unread un
    on un.other_user_id = l.other_user_id
   and un.apartment_id is not distinct from l.apartment_id
  left join public.conversation_preferences cp
    on cp.user_id = v_user_id
   and cp.other_user_id = l.other_user_id
   and cp.apartment_id is not distinct from l.apartment_id
  where a.id is null
     or coalesce(a.landlord_id = v_user_id, false) = (p_portal = 'landlord')
  order by l.created_at desc, l.id desc;
end;
$function$;

revoke all on function public.get_portal_conversations(text) from public, anon;
grant execute on function public.get_portal_conversations(text) to authenticated, service_role;
