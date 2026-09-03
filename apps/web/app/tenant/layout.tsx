import { AppSidebar } from "../components/layout/AppSidebar";
import { AppTopBar } from "../components/layout/AppTopBar";
import { createClient } from "@repo/supabase/server";

const TENANT_NAV = [
  { href: "/browse", label: "Browse", icon: "Search" },
  { href: "/tenant/my-rental", label: "My Rental", icon: "House" },
  { href: "/tenant/applications", label: "Applications", icon: "FileText" },
  { href: "/tenant/favorites", label: "Favorites", icon: "Heart" },
  { href: "/tenant/payment", label: "Payments", icon: "Banknote" },
  { href: "/tenant/maintenance", label: "Maintenance", icon: "Wrench" },
  { href: "/tenant/messages", label: "Messages", icon: "MessageCircle" },
] as const;

const TENANT_TITLES: Record<string, string> = {
  "/browse": "Browse",
  "/tenant/my-rental": "My Rental",
  "/tenant/applications": "Applications",
  "/tenant/favorites": "Favorites",
  "/tenant/payment": "Payments",
  "/tenant/maintenance": "Maintenance",
  "/tenant/messages": "Messages",
};

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Tenant";
  const userRole = "Tenant";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();
      const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
      if (fullName) userName = fullName;
      else if (user.email) userName = user.email;
    }
  } catch {
    // fallback to defaults — layout remains server-renderable
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar navItems={[...TENANT_NAV]} userName={userName} userRole={userRole} />
      <div className="flex flex-1 flex-col min-w-0">
        <AppTopBar titleMap={TENANT_TITLES} />
        <main className="flex flex-1 min-h-0 flex-col w-full overflow-hidden bg-background">{children}</main>
      </div>
    </div>
  );
}