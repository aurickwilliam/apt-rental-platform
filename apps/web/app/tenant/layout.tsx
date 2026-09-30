import { AppSidebar, MobileSidebarNavigation } from "../components/layout/AppSidebar";
import { createClient } from "@repo/supabase/server";

const TENANT_NAV = [
  { href: "/tenant/browse", label: "Browse", icon: "Search" },
  { href: "/tenant/my-rental", label: "My Rental", icon: "Home" },
  { href: "/tenant/favorites", label: "Favorites", icon: "Heart" },
  { href: "/tenant/maintenance", label: "Maintenance", icon: "Tool" },
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
    // fallback to defaults — layout remains server-renderable
  }

  return (
    <div className="flex min-h-screen bg-background [--sidebar-primary:var(--primary)] [--sidebar-primary-foreground:var(--primary-foreground)]">
      <AppSidebar
        navItems={[...TENANT_NAV]}
        userName={userName}
        userRole={userRole}
        avatarUrl={avatarUrl}
        userRoles={userRoles}
        activePortal="tenant"
        profileHref="/tenant/profile"
        settingsHref="/settings"
        iconSet="tabler"
        collapsible
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col bg-background pb-20 md:pb-0">{children}</main>
      </div>
      <MobileSidebarNavigation
        navItems={[...TENANT_NAV, { href: "/tenant/profile", label: "Profile", icon: "User" }]}
        iconSet="tabler"
        navLabel="Tenant navigation"
        menuLabel="Tenant pages"
        buttonLabel="Open tenant navigation"
      />
    </div>
  );
}
