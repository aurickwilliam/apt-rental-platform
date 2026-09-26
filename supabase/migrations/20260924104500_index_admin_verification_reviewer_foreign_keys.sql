-- Cover foreign keys used by review and audit lookups.
create index if not exists apartment_verifications_reviewed_by_idx
  on public.apartment_verifications (reviewed_by);

create index if not exists admin_audit_logs_admin_id_idx
  on public.admin_audit_logs (admin_id);
