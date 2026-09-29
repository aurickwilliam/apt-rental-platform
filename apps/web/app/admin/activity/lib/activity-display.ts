export interface ActivityAdmin {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface AdminActivityEvent {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
  admin: ActivityAdmin | null;
}

export function getAdminName(admin: ActivityAdmin | null) {
  if (!admin) return "Administrator";
  return (
    `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() ||
    admin.email ||
    "Administrator"
  );
}

export function targetHref(
  targetType: string,
  targetId: string,
): string | null {
  if (targetType === "user") return `/admin/users/${targetId}`;
  if (targetType === "apartment") return `/admin/apartments/${targetId}`;
  return null;
}

export const activityDateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});
