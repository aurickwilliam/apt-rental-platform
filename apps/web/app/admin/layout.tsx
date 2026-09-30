import { Suspense } from "react";
import { AppSidebar, MobileSidebarNavigation } from "@/app/components/layout/AppSidebar";
import AdminSettingsOverlay from "./AdminSettingsOverlay";
import { requireAdmin } from "./_lib/require-admin";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/apartments", label: "Apartments", icon: "Building2" },
  { href: "/admin/verification", label: "Verification", icon: "ShieldCheck" },
  { href: "/admin/activity", label: "Activity", icon: "History" },
  { href: "/admin/analytics", label: "Analytics", icon: "ChartBar" },
] as const;

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
    <div className="flex min-h-screen bg-background [--sidebar-primary:var(--primary)] [--sidebar-primary-foreground:var(--primary-foreground)]">
      <AppSidebar
        navItems={[...ADMIN_NAV]}
        userName={userName}
        userRole="Administrator"
        userAvatarUrl={profile.avatar_url}
        profileHref="/admin/profile"
        settingsQueryParam="account"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col bg-background pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileSidebarNavigation
        navItems={[...ADMIN_NAV, { href: "/admin/profile", label: "Profile", icon: "User" }]}
        iconSet="tabler"
      />
      <Suspense fallback={null}>
        <AdminSettingsOverlay />
      </Suspense>
    </div>
  );
}
