"use client";

import { useRef, useState } from "react";
import { canRequestMaintenance } from "@/lib/tenant-maintenance";

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
  const submitting = useRef(false);

  const submit = async (args: {
    apartmentId: string;
    tenancyId?: string;
    form: SubmitMaintenanceForm;
    files: File[];
  }) => {
    if (submitting.current) return { success: false as const, error: "A request is already being submitted." };
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

    submitting.current = true;
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
      let query = supabase.from("tenancies").select("id, landlord_id, status")
        .eq("tenant_id", tenantId).eq("apartment_id", args.apartmentId).eq("status", "active").limit(2);
      if (args.tenancyId) query = query.eq("id", args.tenancyId);
      const { data: rentals, error: rentalError } = await query;
      if (rentalError) throw new Error(rentalError.message);
      if (!rentals || rentals.length !== 1 || !canRequestMaintenance(rentals[0])) {
        throw new Error("Choose a current active rental before submitting maintenance.");
      }
      const rental = rentals[0];

      if (args.files.length > 0) {
        const paths = await uploadMaintenanceImages(args.files, tenantId);
        uploadedSoFar.push(...paths);
      }

      const { id } = await insertMaintenanceRequest({
        tenant_id: tenantId,
        tenancy_id: rental.id,
        apartment_id: args.apartmentId,
        landlord_id: rental.landlord_id,
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
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
