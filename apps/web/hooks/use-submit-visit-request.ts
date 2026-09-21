"use client";

import { useState } from "react";

import { getTenantContext } from "@/service/favoritesService";
import { insertVisitRequest } from "@/service/visitRequestsService";

export type SubmitVisitForm = {
  visitDate: string;
  visitHour: string;
  period: "AM" | "PM";
  noVisitors: string;
  notes: string;
};

export function useSubmitVisitRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitVisitRequest = async (args: {
    apartmentId: string;
    applicationId: string;
    landlordId: string;
    form: SubmitVisitForm;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const context = await getTenantContext();
      if (!context.tenantId) {
        throw new Error("You must be signed in to request a visit.");
      }
      const noVisitors = parseInt(args.form.noVisitors, 10);
      if (!args.form.visitDate || !args.form.visitHour || Number.isNaN(noVisitors) || noVisitors <= 0) {
        throw new Error("Please complete the visit details.");
      }
      await insertVisitRequest({
        apartmentId: args.apartmentId,
        applicationId: args.applicationId,
        landlordId: args.landlordId,
        tenantId: context.tenantId,
        visitDate: args.form.visitDate,
        visitHour: args.form.visitHour,
        period: args.form.period,
        noVisitors,
        notes: args.form.notes,
      });
      return { success: true as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit visit request.";
      setError(msg);
      return { success: false as const, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return { submitVisitRequest, loading, error };
}
