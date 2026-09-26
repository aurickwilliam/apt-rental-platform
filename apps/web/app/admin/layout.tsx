import { AppSidebar } from "@/app/components/layout/AppSidebar";
import { AppTopBar } from "@/app/components/layout/AppTopBar";
import { requireAdmin } from "./_lib/require-admin";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/apartments", label: "Apartments", icon: "Building2" },
  { href: "/admin/verification", label: "Verification", icon: "ShieldCheck" },
  { href: "/admin/activity", label: "Activity", icon: "History" },
] as const;

const ADMIN_TITLES: Record<string, string> = {
  "/admin/dashboard": "Admin dashboard",
  "/admin/users": "Users",
  "/admin/apartments": "Apartments",
  "/admin/verification": "Verification",
  "/admin/activity": "Activity",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const userName =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    profile.email ||
    "Administrator";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        navItems={[...ADMIN_NAV]}
        userName={userName}
        userRole="Administrator"
        showAccountLinks={false}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar titleMap={ADMIN_TITLES} navItems={[...ADMIN_NAV]} />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          {children}
        </main>
      </div>
    </div>
  );
}
