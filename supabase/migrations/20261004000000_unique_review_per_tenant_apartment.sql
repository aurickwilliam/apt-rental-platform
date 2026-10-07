-- One review per tenant per apartment, enforced at the database level.
--
-- The client already gates this (fetchTenantApartmentReview + canReview), but
-- UNIQUE(tenancy_id) alone still permits a second review through a renewed
-- tenancy or a direct API call. This index closes that gap; it evaluates
-- after the sync_review_tenancy_fields trigger backfills tenant_id /
-- apartment_id, so web and mobile inserts are covered with no client changes.
-- Additive and idempotent: no existing rows touched.

CREATE UNIQUE INDEX IF NOT EXISTS reviews_tenant_apartment_unique
  ON public.reviews (tenant_id, apartment_id);
