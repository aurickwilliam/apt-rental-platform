"use client";

import { useState } from "react";

import { MAINTENANCE_CATEGORIES } from "@repo/constants";

import { getTenantContext } from "@/service/favoritesService";
import {
  insertMaintenanceRequest,
  removeMaintenanceImages,
  uploadMaintenanceImages,
  type MaintenanceUrgency,
} from "@/service/maintenanceService";

export type MaintenanceCategorySlug =
  (typeof MAINTENANCE_CATEGORIES)[number]["value"];

export type SubmitMaintenanceForm = {
  title: string;
  category: string;
  message: string;
  urgency: MaintenanceUrgency | null;
};

export function useSubmitMaintenanceRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (args: {
    apartmentId: string;
    form: SubmitMaintenanceForm;
    files: File[];
  }) => {
    setError(null);

    const title = args.form.title.trim();
    const message = args.form.message.trim();
    if (!title) {
      const msg = "Title is required.";
      setError(msg);
      return { success: false as const, error: msg };
    }
    if (!args.form.category) {
      const msg = "Category is required.";
      setError(msg);
      return { success: false as const, error: msg };
    }
    if (!message) {
      const msg = "Description is required.";
      setError(msg);
      return { success: false as const, error: msg };
    }
    if (!args.form.urgency) {
      const msg = "Please select an urgency level.";
      setError(msg);
      return { success: false as const, error: msg };
    }

    setIsSubmitting(true);
    const uploadedSoFar: string[] = [];

    try {
      const context = await getTenantContext();
      if (!context.tenantId) {
        throw new Error("You must be signed in to submit a maintenance request.");
      }
      const tenantId = context.tenantId;

      const { createClient } = await import("@repo/supabase/browser");
      const supabase = createClient();
      const { data: apartment, error: apartmentError } = await supabase
        .from("apartments")
        .select("landlord_id")
        .eq("id", args.apartmentId)
        .single();
      if (apartmentError) throw apartmentError;

      if (args.files.length > 0) {
        const paths = await uploadMaintenanceImages(args.files, tenantId);
        uploadedSoFar.push(...paths);
      }

      const { id } = await insertMaintenanceRequest({
        tenant_id: tenantId,
        apartment_id: args.apartmentId,
        landlord_id: (apartment as { landlord_id: string | null }).landlord_id,
        title,
        category: args.form.category,
        urgency: args.form.urgency,
        message,
        image_paths: uploadedSoFar,
      });

      return { success: true as const, requestId: id };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit maintenance request.";
      setError(msg);
      await removeMaintenanceImages(uploadedSoFar);
      return { success: false as const, error: msg };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
