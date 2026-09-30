import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import { createClient } from "@repo/supabase/server";

const LANDLORD_NAV = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/landlord/properties", label: "My Properties", icon: "Building" },
  { href: "/landlord/applications", label: "Applications", icon: "FileCheck" },
  { href: "/landlord/maintenance-requests", label: "Maintenance", icon: "Tool" },
  { href: "/landlord/payments", label: "Payments", icon: "CashBanknote" },
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
  let avatarUrl: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, avatar_url, roles")
        .eq("user_id", user.id)
        .single();
      const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
      if (fullName) userName = fullName;
      else if (user.email) userName = user.email;
      avatarUrl = profile?.avatar_url ?? user.user_metadata.avatar_url ?? null;
      if (profile?.roles && profile.roles.length > 0) userRoles = profile.roles;
    }
  } catch {
    // fallback to defaults
  }

  return (
    <div className="flex min-h-screen bg-background [--sidebar-primary:var(--primary)] [--sidebar-primary-foreground:var(--primary-foreground)]">
      <AppSidebar
        navItems={[...LANDLORD_NAV]}
        userName={userName}
        userRole={userRole}
        avatarUrl={avatarUrl}
        userRoles={userRoles}
        activePortal="landlord"
        profileHref="/landlord/profile"
        settingsHref="/settings"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col bg-background pb-20 md:pb-0">{children}</main>
      </div>
      <MobileSidebarNavigation
        navItems={[...LANDLORD_NAV, { href: "/landlord/profile", label: "Profile", icon: "User" }]}
        iconSet="tabler"
        navLabel="Landlord navigation"
        menuLabel="Landlord pages"
        buttonLabel="Open landlord navigation"
      />
    </div>
  );
}
