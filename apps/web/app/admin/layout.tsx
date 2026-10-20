import { Suspense } from "react";
import { AppSidebar, MobileSidebarNavigation } from "@/app/components/layout/AppSidebar";
import SettingsOverlay from "@/app/components/settings/SettingsOverlay";
import NotificationsOverlay from "@/app/components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "@/app/components/notifications/DraggableNotificationBell";
import { requireAdmin } from "./_lib/require-admin";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/apartments", label: "Apartments", icon: "Building2" },
  { href: "/admin/verification", label: "Verification", icon: "ShieldCheck", activityKey: "verification" },
  { href: "/admin/reports", label: "Reports", icon: "Flag" },
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
        userRoles={profile.roles}
        activePortal="admin"
        profileHref="/admin/profile"
        settingsQueryParam="open"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DraggableNotificationBell activePortal="admin" />
        <main className="flex min-h-0 flex-1 flex-col bg-background pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileSidebarNavigation
        navItems={[...ADMIN_NAV]}
        profileHref="/admin/profile"
        iconSet="tabler"
        navLabel="Admin navigation"
        menuLabel="Admin pages"
        buttonLabel="Open admin navigation"
        userRoles={profile.roles}
        activePortal="admin"
      />
      <Suspense fallback={null}>
        <SettingsOverlay initialRoles={profile.roles} activePortal="admin" />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationsOverlay activePortal="admin" />
      </Suspense>
    </div>
  );
}
