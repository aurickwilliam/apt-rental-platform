import { Suspense } from "react";
import { translate } from "@repo/i18n";
import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import SettingsOverlay from "../components/settings/SettingsOverlay";
import NotificationsOverlay from "../components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "../components/notifications/DraggableNotificationBell";
import { getServerIdentity } from "@/lib/server-identity";

import { canManageLandlordFinances } from "@/lib/landlord-finance-access";
import { canViewPassport } from "@/lib/passport-access";
import { getServerLocale } from "@/lib/i18n/locale";

const PASSPORT_HREF = "/landlord/passport";
const ANALYTICS_HREF = "/landlord/analytics";

const LANDLORD_NAV = [
  { href: "/landlord/dashboard", labelKey: "nav.dashboard", icon: "LayoutDashboard", prefetchOnIntent: true, sectionKey: "nav.section.overview" },
  { href: "/landlord/properties", labelKey: "nav.properties", icon: "Building", activityKey: "properties", prefetchOnIntent: true, sectionKey: "nav.section.rentals" },
  { href: "/landlord/applications", labelKey: "nav.applications", icon: "FileCheck", activityKey: "applications", prefetchOnIntent: true, sectionKey: "nav.section.rentals" },
  { href: "/landlord/maintenance-requests", labelKey: "nav.maintenance", icon: "Tool", activityKey: "maintenance", prefetchOnIntent: true, sectionKey: "nav.section.rentals" },
  { href: "/landlord/messages", labelKey: "nav.messages", icon: "Messages", activityKey: "messages", sectionKey: "nav.section.rentals" },
  { href: "/landlord/payments", labelKey: "nav.payments", icon: "CashBanknote", activityKey: "payments", prefetchOnIntent: true, sectionKey: "nav.section.finance" },
  { href: ANALYTICS_HREF, labelKey: "nav.analytics", icon: "ChartBar", prefetchOnIntent: true, sectionKey: "nav.section.finance" },
  { href: PASSPORT_HREF, labelKey: "nav.passport", icon: "ShieldCheck", activityKey: "passport", sectionKey: "nav.section.verification" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getServerLocale();
  const landlordRole = translate(language, "nav.role.landlord");
  let userName = landlordRole;
  const userRole = landlordRole;
  let userRoles: string[] = ["landlord"];
  let userAvatarUrl: string | null = null;
  let accountStatus: string | null = null;

  try {
    const { user, profile } = await getServerIdentity();
    if (user) {
      const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
      if (fullName) userName = fullName;
      else if (user.email) userName = user.email;
      if (profile?.roles && profile.roles.length > 0) userRoles = profile.roles;
      userAvatarUrl = profile?.avatar_url ?? null;
      accountStatus = profile?.account_status ?? null;
    }
  } catch {
    // fallback to defaults
  }

  // Pending/unverified accounts can't open the Passport (the route guard
  // redirects them), so don't offer the link. Profit & planning is offered
  // only to landlord members — admins and tenants keep zero finance access.
  // Suspension is invisible here (suspended sessions are deleted), so the
  // filter checks roles and the analytics route guard enforces the rest.
  const navItems = LANDLORD_NAV.filter(
    (item) =>
      (item.href !== PASSPORT_HREF || canViewPassport(accountStatus)) &&
      (item.href !== ANALYTICS_HREF ||
        canManageLandlordFinances({ roles: userRoles, isSuspended: false })),
  );

  return (
    <div className="flex min-h-screen bg-background [--sidebar-primary:var(--primary)] [--sidebar-primary-foreground:var(--primary-foreground)]">
      <AppSidebar
        navItems={navItems}
        userName={userName}
        userRole={userRole}
        userAvatarUrl={userAvatarUrl}
        userRoles={userRoles}
        activePortal="landlord"
        profileHref="/landlord/profile"
        settingsQueryParam="open"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebarNavigation
          navItems={navItems}
          profileHref="/landlord/profile"
          iconSet="tabler"
          userRoles={userRoles}
          activePortal="landlord"
        />
        <DraggableNotificationBell activePortal="landlord" />
        <main className="flex min-h-0 flex-1 flex-col bg-background">{children}</main>
      </div>
      <Suspense fallback={null}>
        <SettingsOverlay initialRoles={userRoles} activePortal="landlord" />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationsOverlay activePortal="landlord" />
      </Suspense>
    </div>
  );
}
