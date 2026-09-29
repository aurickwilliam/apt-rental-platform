import type { Database } from "@repo/supabase";

type Tables<Name extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Name]["Row"];

export type Apartment = Tables<"apartments">;
export type ApartmentImage = Pick<
  Tables<"apartment_images">,
  "id" | "url" | "url_thumb" | "is_cover"
>;
export type Landlord = Pick<
  Tables<"users">,
  | "id"
  | "first_name"
  | "last_name"
  | "email"
  | "mobile_number"
  | "avatar_url"
  | "account_status"
  | "created_at"
  | "updated_at"
>;
export type Verification = Pick<
  Tables<"apartment_verifications">,
  | "id"
  | "status"
  | "submitted_at"
  | "reviewed_at"
  | "reviewed_by"
  | "rejection_reason"
> & { reviewer_name: string | null };
export type Tenancy = Pick<
  Tables<"tenancies">,
  "id" | "status" | "lease_start" | "lease_end" | "monthly_rent"
> & { tenant_name: string | null };
export type Payment = Pick<Tables<"payment">, "status" | "date" | "due_date">;
export type Application = Pick<
  Tables<"rental_application">,
  "id" | "status" | "created_at"
>;
export type Visit = Pick<
  Tables<"visit_request">,
  "id" | "status" | "visit_date" | "confirmed_visit_date"
>;
export type Maintenance = Pick<
  Tables<"maintenance_request">,
  "id" | "title" | "urgency" | "status" | "created_at"
>;
export type Review = Pick<
  Tables<"reviews">,
  "id" | "rating" | "comment" | "created_at"
>;
export type Activity = Pick<
  Tables<"admin_audit_logs">,
  "id" | "action" | "reason" | "created_at"
> & { admin_name: string | null };

export interface Summary<T> {
  items: T[];
  counts: Record<string, number>;
  error: boolean;
}
