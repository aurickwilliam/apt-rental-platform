import { Suspense } from "react";
import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import SettingsOverlay from "../components/settings/SettingsOverlay";
import NotificationsOverlay from "../components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "../components/notifications/DraggableNotificationBell";
import ReviewUnlockGate from "./components/ReviewUnlockGate";
import { getServerIdentity } from "@/lib/server-identity";

import { canViewPassport } from "@/lib/passport-access";

const PASSPORT_HREF = "/tenant/passport";
const FAVORITES_HREF = "/tenant/favorites";

const TENANT_NAV = [
  { href: "/tenant/browse", label: "Browse", icon: "Search" },
  { href: "/tenant/my-rental", label: "My Rental", icon: "Home", activityKey: "rental" },
  { href: "/tenant/maintenance", label: "Maintenance", icon: "Tool", activityKey: "maintenance" },
  { href: PASSPORT_HREF, label: "APT Passport", icon: "FileCheck", activityKey: "passport" },
  { href: "/tenant/messages", label: "Messages", icon: "MessageCircle", activityKey: "messages" },
] as const;

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Tenant";
  const userRole = "Tenant";
  let userRoles: string[] = ["tenant"];
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
    // fallback to defaults — layout remains server-renderable
  }

  // Pending/unverified accounts can't open the Passport (the route guard
  // redirects them), so don't offer the link.
  const navItems = canViewPassport(accountStatus)
    ? [...TENANT_NAV]
    : TENANT_NAV.filter((item) => item.href !== PASSPORT_HREF);

  return (
    <div className="flex min-h-screen bg-background [--sidebar-primary:var(--primary)] [--sidebar-primary-foreground:var(--primary-foreground)]">
      <AppSidebar
        navItems={navItems}
        userName={userName}
        userRole={userRole}
        userAvatarUrl={userAvatarUrl}
        userRoles={userRoles}
        activePortal="tenant"
        profileHref="/tenant/profile"
        favoritesHref={FAVORITES_HREF}
        settingsQueryParam="open"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebarNavigation
          navItems={navItems}
          profileHref="/tenant/profile"
          favoritesHref={FAVORITES_HREF}
          iconSet="tabler"
          navLabel="Tenant navigation"
          menuLabel="Tenant pages"
          buttonLabel="Open tenant navigation"
          userRoles={userRoles}
          activePortal="tenant"
        />
        <DraggableNotificationBell activePortal="tenant" />
        <main className="flex min-h-0 flex-1 flex-col bg-background">{children}</main>
      </div>
      <Suspense fallback={null}>
        <SettingsOverlay initialRoles={userRoles} activePortal="tenant" />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationsOverlay activePortal="tenant" />
      </Suspense>
      <ReviewUnlockGate />
    </div>
  );
}
