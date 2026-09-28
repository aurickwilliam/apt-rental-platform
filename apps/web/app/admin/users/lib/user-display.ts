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

export function getUserName(user: AdminUser) {
  return (
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed user"
  );
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
