export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  roles: string[];
  account_status: string;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  middle_name: string | null;
  suffix: string | null;
  mobile_number: string | null;
  gender: string | null;
  birth_date: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postal_code: number | null;
  background_url: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  updated_at: string | null;
}

export function getFullName(user: {
  first_name: string | null;
  middle_name?: string | null;
  last_name: string | null;
  suffix?: string | null;
}) {
  return (
    [user.first_name, user.middle_name, user.last_name, user.suffix]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ") || "Unnamed user"
  );
}

export function getUserName(user: AdminUser) {
  return (
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed user"
  );
}

export function formatUserAddress(user: {
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postal_code: number | null;
}) {
  return (
    [
      user.street_address,
      user.barangay,
      user.city,
      user.province,
      user.postal_code ? String(user.postal_code) : null,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(", ") || "—"
  );
}

export function getAge(birthDate: string | null) {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

export function getAccountAgeDays(createdAt: string) {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatRoles(roles: string[]) {
  return (
    roles
      .map((role) => (role ? `${role[0].toUpperCase()}${role.slice(1)}` : role))
      .join(", ") || "—"
  );
}

export function verificationChipColor(
  status: string,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "verified":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

export const joinedFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
