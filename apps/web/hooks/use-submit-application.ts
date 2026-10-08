"use client";

import { useCallback, useState } from "react";

import { evaluateApplicationReadiness } from "@repo/passport";

import { fetchPassportDocumentsWithVerification } from "@/service/passportService";
import { fetchApplicationSubmitContext, insertTenantApplication } from "@/service/tenantApplicationsService";

export type SubmitApplicationForm = {
  occupation: string;
  companyName: string;
  monthlyIncome: number | null;
  employmentType: string;
  prevLandlordName: string;
  prevLandlordContact: string;
  moveInDate: string;
  noOccupants: string;
  hasPets: string | null;
  isSmoker: string | null;
  needParking: string | null;
  additionalNotes: string;
};

type SubmitResult = { success: true; applicationId: string } | { success: false; error: string };

/**
 * Submits a rental application. Nothing is uploaded: the tenant's APT
 * Passport documents are attached by reference (their storage paths),
 * chosen from a fresh Passport read. Account status, ownership and pending
 * applications are re-read too, so a page left open can't skip a check.
 * The database re-validates everything and its messages are shown as-is.
 */
export function useSubmitApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (apartmentId: string, form: SubmitApplicationForm): Promise<SubmitResult> => {
    const fail = (message: string): SubmitResult => {
      setError(message);
      return { success: false, error: message };
    };

    setError(null);

    if (!form.moveInDate) return fail("Move-in date is required.");
    if (form.monthlyIncome === null || Number.isNaN(form.monthlyIncome)) return fail("Monthly income is required.");
    const occupants = parseInt(form.noOccupants, 10);
    if (!form.noOccupants || Number.isNaN(occupants) || occupants <= 0) {
      return fail("Number of occupants is required.");
    }

    setIsSubmitting(true);
    try {
      const context = await fetchApplicationSubmitContext(apartmentId);
      // Links the approved verification ID first, so it's present even if
      // the tenant never opened the Passport.
      const passportDocs = await fetchPassportDocumentsWithVerification(context.tenantId);

      const readiness = evaluateApplicationReadiness({
        accountStatus: context.accountStatus,
        tenantId: context.tenantId,
        landlordId: context.landlordId,
        hasActiveApplication: context.hasActiveApplication,
        passportDocs,
        employmentType: form.employmentType,
      });
      if (!readiness.isReady) return fail(readiness.issues[0].message);

      const { docs } = readiness.selection;
      // Readiness guarantees these; the check narrows the nullable types.
      if (!docs.govId || !docs.proofOfBilling) return fail("Your APT Passport is missing required documents.");

      const { id } = await insertTenantApplication({
        tenant_id: context.tenantId,
        apartment_id: apartmentId,
        occupation: form.occupation,
        employer_name: form.companyName,
        monthly_income: form.monthlyIncome,
        employment_type: form.employmentType,
        prev_landlord_name: form.prevLandlordName.trim() || null,
        prev_landlord_contact: form.prevLandlordContact.trim() || null,
        move_in_date: form.moveInDate,
        no_occupants: occupants,
        has_pets: form.hasPets === "yes",
        has_smoker: form.isSmoker === "yes",
        need_parking: form.needParking === "yes",
        message: form.additionalNotes.trim() || null,
        gov_id_url: docs.govId.storage_path,
        // Only a verification-linked ID has a back capture to share.
        gov_id_back_url: docs.govId.verification_id ? docs.govId.storage_path_back : null,
        proof_of_income_url: docs.proofOfIncome?.storage_path ?? null,
        proof_of_billing_url: docs.proofOfBilling.storage_path,
        nbi_clearance_url: docs.nbiClearance?.storage_path ?? null,
      });

      return { success: true, applicationId: id };
    } catch (err) {
      console.error("Application submit failed", err);
      return fail(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error };
}
