import { Suspense } from "react";
import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import SettingsOverlay from "../components/settings/SettingsOverlay";
import NotificationsOverlay from "../components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "../components/notifications/DraggableNotificationBell";
import { getServerIdentity } from "@/lib/server-identity";

import { canManageLandlordFinances } from "@/lib/landlord-finance-access";
import { canViewPassport } from "@/lib/passport-access";
import { isLandlordAccessBlocked } from "@repo/utils";
import { LANDLORD_VERIFY_REQUIRED_PATH } from "@/lib/landlord-verification-access";
import LandlordAccessGate from "./components/LandlordAccessGate";

const PASSPORT_HREF = "/landlord/passport";
const ANALYTICS_HREF = "/landlord/analytics";

const LANDLORD_NAV = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard", prefetchOnIntent: true, section: "Overview" },
  { href: "/landlord/properties", label: "My Properties", icon: "Building", activityKey: "properties", prefetchOnIntent: true, section: "Rentals" },
  { href: "/landlord/applications", label: "Applications", icon: "FileCheck", activityKey: "applications", prefetchOnIntent: true, section: "Rentals" },
  { href: "/landlord/maintenance-requests", label: "Maintenance", icon: "Tool", activityKey: "maintenance", prefetchOnIntent: true, section: "Rentals" },
  { href: "/landlord/messages", label: "Messages", icon: "Messages", activityKey: "messages", section: "Rentals" },
  { href: "/landlord/payments", label: "Payments", icon: "CashBanknote", activityKey: "payments", prefetchOnIntent: true, section: "Finance" },
  { href: ANALYTICS_HREF, label: "Profit & planning", icon: "ChartBar", prefetchOnIntent: true, section: "Finance" },
  { href: PASSPORT_HREF, label: "APT Passport", icon: "ShieldCheck", activityKey: "passport", section: "Verification" },
] as const;

// Landlord tools stay closed until the account is verified; the one entry
// leads to the page that explains how to get there.
const UNVERIFIED_NAV = [
  { href: LANDLORD_VERIFY_REQUIRED_PATH, label: "Verify account", icon: "ShieldCheck", section: "Verification" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Landlord";
  const userRole = "Landlord";
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
  const blocked = isLandlordAccessBlocked(userRoles, accountStatus);
  const navItems = blocked
    ? [...UNVERIFIED_NAV]
    : LANDLORD_NAV.filter(
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
          navLabel="Landlord navigation"
          menuLabel="Landlord pages"
          buttonLabel="Open landlord navigation"
          userRoles={userRoles}
          activePortal="landlord"
        />
        <DraggableNotificationBell activePortal="landlord" />
        <main className="flex min-h-0 flex-1 flex-col bg-background">
          <LandlordAccessGate blocked={blocked} accountStatus={accountStatus}>
            {children}
          </LandlordAccessGate>
        </main>
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
