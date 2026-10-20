export interface ConversationApartment {
  id: string;
  name: string | null;
  barangay: string | null;
  city: string | null;
  monthly_rent: number | null;
  apartment_images: { url: string; url_thumb: string | null; is_cover: boolean | null }[];
}

export interface ConversationContext {
  apartment: ConversationApartment | null;
  verified: boolean;
}

/** Never reuse another thread's property, even while a new request is settling. */
export function conversationApartmentPresentation(
  apartmentId: string | null,
  apartment: ConversationApartment | null,
  portal: "tenant" | "landlord",
) {
  if (!apartmentId || apartment?.id !== apartmentId) return null;
  const photos = apartment.apartment_images ?? [];
  const photo = photos.find((image) => image.is_cover) ?? photos[0];
  return {
    title: apartment.name?.trim() || "Apartment",
    location: [apartment.barangay, apartment.city].filter((part) => part?.trim()).join(", "),
    rent: typeof apartment.monthly_rent === "number" && Number.isFinite(apartment.monthly_rent) && apartment.monthly_rent > 0
      ? apartment.monthly_rent : null,
    image: photo?.url_thumb || photo?.url || null,
    href: portal === "tenant"
      ? `/tenant/browse/${encodeURIComponent(apartmentId)}`
      : `/landlord/properties/${encodeURIComponent(apartmentId)}`,
  };
}

export type ConversationApartmentPresentation = ReturnType<typeof conversationApartmentPresentation>;
