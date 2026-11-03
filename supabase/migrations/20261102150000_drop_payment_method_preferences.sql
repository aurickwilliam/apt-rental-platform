-- Tenants no longer save preferred payment methods or a default: checkout lists the methods the
-- landlord accepts and the tenant picks one each time. No client reads or writes this table any
-- more, so it is dropped. It held only method names (no card or wallet details). Nothing
-- references it (no foreign keys, views or functions).
drop table if exists public.payment_method_preferences;
