import { Suspense } from "react";
import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import SettingsOverlay from "../components/settings/SettingsOverlay";
import NotificationsOverlay from "../components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "../components/notifications/DraggableNotificationBell";
import ReviewUnlockGate from "./components/ReviewUnlockGate";
import { createClient } from "@repo/supabase/server";

import { canViewPassport } from "@/lib/passport-access";

const PASSPORT_HREF = "/tenant/passport";

const TENANT_NAV = [
  { href: "/tenant/browse", label: "Browse", icon: "Search" },
  { href: "/tenant/my-rental", label: "My Rental", icon: "Home" },
  { href: "/tenant/favorites", label: "Favorites", icon: "Heart" },
  { href: "/tenant/maintenance", label: "Maintenance", icon: "Tool" },
  { href: PASSPORT_HREF, label: "APT Passport", icon: "FileCheck" },
  { href: "/tenant/messages", label: "Messages", icon: "MessageCircle" },
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, roles, avatar_url, account_status")
        .eq("user_id", user.id)
        .single();
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
        settingsQueryParam="open"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DraggableNotificationBell activePortal="tenant" />
        <main className="flex min-h-0 flex-1 flex-col bg-background pb-20 md:pb-0">{children}</main>
      </div>
      <MobileSidebarNavigation
        navItems={navItems}
        profileHref="/tenant/profile"
        iconSet="tabler"
        navLabel="Tenant navigation"
        menuLabel="Tenant pages"
        buttonLabel="Open tenant navigation"
        userRoles={userRoles}
        activePortal="tenant"
      />
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
