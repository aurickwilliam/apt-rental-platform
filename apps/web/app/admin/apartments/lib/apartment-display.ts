import type { StatusTone } from "@/lib/status-tone";

export interface AdminApartment {
  id: string;
  name: string;
  city: string;
  status: string;
  is_verified: boolean;
  is_hidden_by_admin: boolean;
  monthly_rent: number;
  created_at: string;
  thumbnail_url: string | null;
}

export function verificationChipColor(isVerified: boolean): StatusTone {
  return isVerified ? "success" : "neutral";
}

export function visibilityChipColor(isHidden: boolean): StatusTone {
  return isHidden ? "danger" : "success";
}

export const joinedFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export const rentFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
