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

export function statusChipStyle(status: string): {
  color: "success" | "warning" | "default";
  className?: string;
} {
  switch (status) {
    case "available":
      // Mobile colors "available" primary; Chip has no primary colorway,
      // so tint with the primary tokens directly.
      return { color: "default", className: "bg-primary/10 text-primary" };
    case "occupied":
      return { color: "success" };
    case "under_maintenance":
      return { color: "warning" };
    default:
      return { color: "default" };
  }
}

export function verificationChipColor(
  isVerified: boolean,
): "success" | "default" {
  return isVerified ? "success" : "default";
}

export function visibilityChipColor(
  isHidden: boolean,
): "danger" | "success" {
  return isHidden ? "danger" : "success";
}

export const joinedFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
