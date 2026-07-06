import { useState } from "react";
import { File } from "expo-file-system";
import { supabase } from "@repo/supabase";

import { useProfile } from "../auth";

export type MaintenanceCategorySlug =
  | "plumbing_water_fixtures"
  | "appliances"
  | "hvac_climate_control"
  | "electrical_lighting"
  | "general_wear_and_tear"
  | "pest_control"
  | "structural_issues"
  | "safety_security";

export type MaintenanceUrgencySlug = "low" | "medium" | "high";

type SubmitMaintenanceRequestInput = {
  apartmentId: string;
  title: string;
  category: MaintenanceCategorySlug;
  urgency: MaintenanceUrgencySlug;
  message: string;
  imageUris: string[];
};

export function useSubmitMaintenanceRequest() {
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImages = async (uris: string[], tenantId: string): Promise<string[]> => {
    const urls: string[] = [];

    for (const uri of uris) {
      const file = new File(uri);
      const bytes = await file.bytes();
      const filename = `${Date.now()}-${file.name}`;
      const path = `${tenantId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("maintenance-images")
        .upload(path, bytes, { contentType: file.type ?? "image/jpeg" });

      if (uploadError) throw uploadError;

      // signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("maintenance-images")
        .createSignedUrl(path, 60 * 55);

      if (signedUrlError) throw signedUrlError;
      urls.push(signedUrlData.signedUrl);
    }

    return urls;
  };

  const submitRequest = async (input: SubmitMaintenanceRequestInput) => {
    if (!profile) {
      const message = "No profile loaded — cannot submit maintenance request";
      setError(message);
      throw new Error(message);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // resolve landlord_id from the apartment being reported on
      const { data: apartment, error: apartmentError } = await supabase
        .from("apartments")
        .select("landlord_id")
        .eq("id", input.apartmentId)
        .single();

      if (apartmentError) throw apartmentError;

      const imageUrls = input.imageUris.length
        ? await uploadImages(input.imageUris, profile.id)
        : [];

      const { data, error: insertError } = await supabase
        .from("maintenance_request")
        .insert({
          tenant_id: profile.id,
          apartment_id: input.apartmentId,
          landlord_id: apartment.landlord_id,
          title: input.title,
          category: input.category,
          urgency: input.urgency,
          message: input.message,
          image_urls: imageUrls,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to submit maintenance request";
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitRequest, isSubmitting, error, profileReady: !!profile };
}
