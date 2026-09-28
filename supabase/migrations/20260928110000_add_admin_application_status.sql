-- Current status composition of all rental applications, independent of the
-- analytics reporting dates. Closed is also a valid application status.
create function public.get_admin_application_status()
returns table(
  total bigint, pending bigint, approved bigint, rejected bigint,
  cancelled bigint, closed bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.users u
    where u.user_id = (select auth.uid()) and 'admin' = any(u.roles)
  ) then
    raise exception 'Admin access required.';
  end if;

  return query
    select count(*)::bigint,
      count(*) filter (where a.status = 'pending')::bigint,
      count(*) filter (where a.status = 'approved')::bigint,
      count(*) filter (where a.status = 'rejected')::bigint,
      count(*) filter (where a.status = 'cancelled')::bigint,
      count(*) filter (where a.status = 'closed')::bigint
    from public.rental_application a;
end;
$$;

revoke all on function public.get_admin_application_status() from public, anon;
grant execute on function public.get_admin_application_status() to authenticated;
