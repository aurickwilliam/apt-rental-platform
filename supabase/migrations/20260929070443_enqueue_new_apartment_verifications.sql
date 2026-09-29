-- A listing is ready for review only after its cover image has been saved.
-- Both web and mobile insert the apartment before uploading its evidence.
create function public.enqueue_new_apartment_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_cover is not true then
    return new;
  end if;

  insert into public.apartment_verifications (apartment_id, landlord_id)
  select a.id, a.landlord_id
  from public.apartments a
  where a.id = new.apartment_id
    and a.landlord_id is not null
    and a.is_verified = false
    and a.deleted_at is null
    -- A rejected request must be resubmitted deliberately, not when photos change.
    and not exists (
      select 1 from public.apartment_verifications v
      where v.apartment_id = a.id
    )
  on conflict (apartment_id) where status = 'pending' do nothing;

  return new;
end;
$$;

revoke all on function public.enqueue_new_apartment_verification() from public, anon, authenticated;

create trigger enqueue_new_apartment_verification
  after insert on public.apartment_images
  for each row execute function public.enqueue_new_apartment_verification();

-- Recover already-published listings with no request. Existing reviews (including
-- rejections) and deleted or incomplete listings are left untouched.
insert into public.apartment_verifications (apartment_id, landlord_id)
select a.id, a.landlord_id
from public.apartments a
where a.landlord_id is not null
  and a.is_verified = false
  and a.deleted_at is null
  and exists (
    select 1 from public.apartment_images i
    where i.apartment_id = a.id and i.is_cover is true
  )
  and not exists (
    select 1 from public.apartment_verifications v
    where v.apartment_id = a.id
  )
on conflict (apartment_id) where status = 'pending' do nothing;
