"use client";

import { useCallback } from "react";

import { createClient } from "@repo/supabase/browser";

import { useAsyncResource } from "@/hooks/use-async-resource";
import {
  applicantPersonalInfo,
  type ApplicantPersonalInfo,
  type ApplicantProfile,
} from "@/lib/application-profile";

const EMPTY: ApplicantPersonalInfo = {
  fullName: "",
  email: "",
  dateOfBirth: "",
  contactNumber: "",
  currentAddress: "",
};

/**
 * The applicant's identity details for the application detail page, taken
 * from the tenant's own profile (read-only, as in the apply form).
 */
export function useApplicantPersonalInfo(tenantId: string | null) {
  const load = useCallback(async (): Promise<ApplicantPersonalInfo> => {
    if (!tenantId) return EMPTY;
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("users")
      .select(
        "first_name, middle_name, last_name, email, mobile_number, birth_date, street_address, barangay, city, province",
      )
      .eq("id", tenantId)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return EMPTY;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return applicantPersonalInfo(
      profile as unknown as ApplicantProfile,
      user?.email ?? null,
    );
  }, [tenantId]);
  const { data, loading, error } = useAsyncResource(
    load,
    EMPTY,
    "Failed to load applicant profile.",
  );

  return { personalInfo: data, loading, error };
}
