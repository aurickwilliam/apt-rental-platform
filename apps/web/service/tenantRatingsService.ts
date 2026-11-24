"use client";

import { createClient } from "@repo/supabase/browser";
import { summarizeTenantReviews, toTenantReviewRecords, type TenantReviewRecord } from "@repo/utils";

export interface ApplicantRatings {
  records: TenantReviewRecord[];
  /** Mean of the individual ratings (0 when there are none). */
  average: number;
  count: number;
}

/**
 * A tenant's ratings from landlords, newest first (at most 50). Read only through
 * `get_tenant_reviews()`: it applies who may read (a landlord with an application or
 * tenancy for the tenant), leaves out admin-hidden ratings and adds the author and
 * stay context that other landlords cannot read from the tenancy itself.
 */
export async function fetchApplicantRatings(tenantId: string): Promise<ApplicantRatings> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_tenant_reviews", { p_tenant_id: tenantId });
  if (error) throw error;

  const records = toTenantReviewRecords(data ?? []);
  return { records, ...summarizeTenantReviews(records.map((record) => record.rating)) };
}
