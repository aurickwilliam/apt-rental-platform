import { Suspense } from "react";
import { translate } from "@repo/i18n";
import { AppSidebar, MobileSidebarNavigation } from "@/app/components/layout/AppSidebar";
import SettingsOverlay from "@/app/components/settings/SettingsOverlay";
import NotificationsOverlay from "@/app/components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "@/app/components/notifications/DraggableNotificationBell";
import { getServerLocale } from "@/lib/i18n/locale";
import { requireAdmin } from "./_lib/require-admin";

const ADMIN_NAV = [
  { href: "/admin/dashboard", labelKey: "nav.dashboard", icon: "LayoutDashboard" },
  { href: "/admin/users", labelKey: "nav.users", icon: "Users" },
  { href: "/admin/apartments", labelKey: "nav.apartments", icon: "Building2" },
  { href: "/admin/verification", labelKey: "nav.verification", icon: "ShieldCheck", activityKey: "verification" },
  { href: "/admin/reports", labelKey: "nav.reports", icon: "Flag" },
  { href: "/admin/activity", labelKey: "nav.activity", icon: "History" },
  { href: "/admin/analytics", labelKey: "nav.analyticsAdmin", icon: "ChartBar" },
  { href: "/admin/app-updates", labelKey: "nav.appUpdates", icon: "DeviceMobile" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, language] = await Promise.all([requireAdmin(), getServerLocale()]);
  const adminRole = translate(language, "nav.role.administrator");
  const userName =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    profile.email ||
    adminRole;

  return (
    <div className="flex min-h-screen bg-background [--sidebar-primary:var(--primary)] [--sidebar-primary-foreground:var(--primary-foreground)]">
      <AppSidebar
        navItems={[...ADMIN_NAV]}
        userName={userName}
        userRole={adminRole}
        userAvatarUrl={profile.avatar_url}
        userRoles={profile.roles}
        activePortal="admin"
        profileHref="/admin/profile"
        settingsQueryParam="open"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebarNavigation
          navItems={[...ADMIN_NAV]}
          profileHref="/admin/profile"
          iconSet="tabler"
          userRoles={profile.roles}
          activePortal="admin"
        />
        <DraggableNotificationBell activePortal="admin" />
        <main className="flex min-h-0 flex-1 flex-col bg-background">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <SettingsOverlay initialRoles={profile.roles} activePortal="admin" />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationsOverlay activePortal="admin" />
      </Suspense>
    </div>
  );
}
