"use client";

import { useMemo } from "react";

import { evaluateApplicationReadiness, type ApplicationIssue } from "@repo/passport";

import { usePassportDocuments } from "@/hooks/use-passport-documents";

interface UseApplicationReadinessInput {
  userId: string;
  accountStatus: string | null;
  landlordId: string | null;
  hasActiveApplication: boolean;
  /** Unknown until the tenant picks it; proof of income is skipped while null. */
  employmentType?: string | null;
}

function isPassportIssue(issue: ApplicationIssue): boolean {
  return issue.code === "passport-missing" || issue.code === "passport-expired";
}

/**
 * Live "can this tenant apply?" state for the apply flow: verified account,
 * not their own listing, no pending application, and a complete Passport.
 * Feedback only; submit re-checks with fresh data and the database decides.
 */
export function useApplicationReadiness({
  userId,
  accountStatus,
  landlordId,
  hasActiveApplication,
  employmentType = null,
}: UseApplicationReadinessInput) {
  const { documents, loading, error, refresh } = usePassportDocuments(userId);

  const readiness = useMemo(() => {
    const base = { accountStatus, tenantId: userId, landlordId, hasActiveApplication, passportDocs: documents };
    const current = evaluateApplicationReadiness({ ...base, employmentType });
    return {
      ...current,
      // Issues that don't depend on the form (proof of income is only checked
      // once employment is known), shown up front instead of mid-form.
      upfrontIssues: evaluateApplicationReadiness({ ...base, employmentType: null }).issues,
      // A required document is missing or expired, so "submitted automatically" doesn't apply yet.
      isPassportIncomplete: current.issues.some(isPassportIssue),
    };
  }, [accountStatus, userId, landlordId, hasActiveApplication, documents, employmentType]);

  return { ...readiness, loading, error, refresh };
}
