"use client";

import { useMemo } from "react";

import { evaluateApplicationReadiness } from "@repo/passport";

import { usePassportDocuments } from "@/hooks/use-passport-documents";

interface UseApplicationReadinessInput {
  userId: string;
  accountStatus: string | null;
  landlordId: string | null;
  hasActiveApplication: boolean;
  /** Unknown until the tenant picks it; proof of income is skipped while null. */
  employmentType?: string | null;
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

  const readiness = useMemo(
    () =>
      evaluateApplicationReadiness({
        accountStatus,
        tenantId: userId,
        landlordId,
        hasActiveApplication,
        passportDocs: documents,
        employmentType,
      }),
    [accountStatus, userId, landlordId, hasActiveApplication, documents, employmentType],
  );

  return { ...readiness, loading, error, refresh };
}
