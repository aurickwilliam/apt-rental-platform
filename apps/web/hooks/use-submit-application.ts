"use client";

import { useCallback, useState } from "react";

import { requiresProofOfIncome } from "@repo/constants";
import { getTenantContext } from "@/service/favoritesService";
import {
  insertTenantApplication,
} from "@/service/tenantApplicationsService";
import {
  removeApplicationDocuments,
  uploadApplicationDocument,
  type ApplicationDocKey,
} from "@/service/applicationDocumentsService";

export type SubmitApplicationFiles = {
  govIdFile: File | null;
  proofOfBillingFile: File | null;
  proofOfIncomeFile: File | null;
  nbiClearanceFile: File | null;
};

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

export function useSubmitApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (apartmentId: string, form: SubmitApplicationForm, files: SubmitApplicationFiles) => {
      setError(null);

      if (!files.govIdFile) {
        const msg = "Government-issued ID is required.";
        setError(msg);
        return { success: false as const, error: msg };
      }
      if (requiresProofOfIncome(form.employmentType || "") && !files.proofOfIncomeFile) {
        const msg = "Proof of income is required.";
        setError(msg);
        return { success: false as const, error: msg };
      }
      if (!files.proofOfBillingFile) {
        const msg = "Proof of billing is required.";
        setError(msg);
        return { success: false as const, error: msg };
      }
      if (!form.moveInDate) {
        const msg = "Move-in date is required.";
        setError(msg);
        return { success: false as const, error: msg };
      }
      if (form.monthlyIncome === null || Number.isNaN(form.monthlyIncome)) {
        const msg = "Monthly income is required.";
        setError(msg);
        return { success: false as const, error: msg };
      }
      const occupants = parseInt(form.noOccupants, 10);
      if (!form.noOccupants || Number.isNaN(occupants) || occupants <= 0) {
        const msg = "Number of occupants is required.";
        setError(msg);
        return { success: false as const, error: msg };
      }

      setIsSubmitting(true);
      const uploadedSoFar: string[] = [];

      try {
        const context = await getTenantContext();
        if (!context.tenantId) {
          throw new Error("You must be signed in to submit an application.");
        }
        const tenantId = context.tenantId;
        const folderId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const uploadOne = async (file: File | null, docKey: ApplicationDocKey) => {
          if (!file) return null;
          const path = await uploadApplicationDocument(file, tenantId, folderId, docKey);
          uploadedSoFar.push(path);
          return path;
        };

        const govIdPath = await uploadOne(files.govIdFile, "govId");
        const proofOfIncomePath = await uploadOne(files.proofOfIncomeFile, "proofOfIncome");
        const proofOfBillingPath = await uploadOne(files.proofOfBillingFile, "proofOfBilling");
        const nbiPath = await uploadOne(files.nbiClearanceFile, "nbiClearance");

        if (!govIdPath || !proofOfBillingPath) {
          throw new Error("Failed to upload required documents.");
        }

        const { id } = await insertTenantApplication({
          tenant_id: tenantId,
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
          gov_id_url: govIdPath,
          proof_of_income_url: proofOfIncomePath,
          proof_of_billing_url: proofOfBillingPath,
          nbi_clearance_url: nbiPath,
        });

        return { success: true as const, applicationId: id };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to submit application.";
        setError(msg);
        await removeApplicationDocuments(uploadedSoFar);
        return { success: false as const, error: msg };
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { submit, isSubmitting, error };
}
