-- Fix identifier shadowing in payout_destination verified-gate policies.
--
-- dest_insert_own_verified / dest_update_own_verified compared
-- `u.id = user_id` inside an EXISTS subquery on public.users. The bare
-- `user_id` resolves to u.user_id (inner scope wins over the new row's
-- column), making the predicate `u.id = u.user_id` — always false — so every
-- authenticated INSERT/UPDATE failed with 42501 regardless of verification
-- status. service_role bypasses RLS, which is why seeding and process-payouts
-- never surfaced it.
--
-- Rewrite: pin row ownership via the canonical
-- (select id from users where user_id = auth.uid()) resolution, then check
-- that same caller's account_status.

drop policy if exists dest_insert_own_verified on public.payout_destination;
create policy dest_insert_own_verified on public.payout_destination
  for insert to authenticated
  with check (
    user_id = (select id from public.users where user_id = auth.uid())
    and 'verified' = (
      select u.account_status from public.users u where u.user_id = auth.uid()
    )
  );

drop policy if exists dest_update_own_verified on public.payout_destination;
create policy dest_update_own_verified on public.payout_destination
  for update to authenticated
  using (
    user_id = (select id from public.users where user_id = auth.uid())
  )
  with check (
    user_id = (select id from public.users where user_id = auth.uid())
    and 'verified' = (
      select u.account_status from public.users u where u.user_id = auth.uid()
    )
  );
