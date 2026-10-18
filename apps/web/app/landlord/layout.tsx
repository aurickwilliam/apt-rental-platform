import { Suspense } from "react";
import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import SettingsOverlay from "../components/settings/SettingsOverlay";
import NotificationsOverlay from "../components/notifications/NotificationsOverlay";
import DraggableNotificationBell from "../components/notifications/DraggableNotificationBell";
import { createClient } from "@repo/supabase/server";

import { canViewPassport } from "@/lib/passport-access";

const PASSPORT_HREF = "/landlord/passport";

const LANDLORD_NAV = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard", prefetchOnIntent: true },
  { href: "/landlord/properties", label: "My Properties", icon: "Building", prefetchOnIntent: true },
  { href: "/landlord/applications", label: "Applications", icon: "FileCheck", prefetchOnIntent: true },
  { href: "/landlord/maintenance-requests", label: "Maintenance", icon: "Tool", prefetchOnIntent: true },
  { href: "/landlord/payments", label: "Payments", icon: "CashBanknote", prefetchOnIntent: true },
  { href: PASSPORT_HREF, label: "APT Passport", icon: "ShieldCheck" },
  { href: "/landlord/messages", label: "Messages", icon: "Messages" },
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
    // fallback to defaults
  }

  // Pending/unverified accounts can't open the Passport (the route guard
  // redirects them), so don't offer the link.
  const navItems = canViewPassport(accountStatus)
    ? [...LANDLORD_NAV]
    : LANDLORD_NAV.filter((item) => item.href !== PASSPORT_HREF);

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
        <DraggableNotificationBell activePortal="landlord" />
        <main className="flex min-h-0 flex-1 flex-col bg-background pb-20 md:pb-0">{children}</main>
      </div>
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
      <Suspense fallback={null}>
        <SettingsOverlay initialRoles={userRoles} activePortal="landlord" />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationsOverlay activePortal="landlord" />
      </Suspense>
    </div>
  );
}
