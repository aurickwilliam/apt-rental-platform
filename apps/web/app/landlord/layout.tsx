import { AppSidebar } from "../components/layout/AppSidebar";
import { AppTopBar } from "../components/layout/AppTopBar";
import { createClient } from "@repo/supabase/server";

const LANDLORD_NAV = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/landlord/properties", label: "My Properties", icon: "Building2" },
  { href: "/landlord/applications", label: "Applications", icon: "FileCheckCorner" },
  { href: "/landlord/payments", label: "Payments", icon: "Banknote" },
  { href: "/landlord/messages", label: "Messages", icon: "MessagesSquare" },
] as const;

const LANDLORD_TITLES: Record<string, string> = {
  "/landlord/dashboard": "Dashboard",
  "/landlord/properties": "My Properties",
  "/landlord/applications": "Applications",
  "/landlord/payments": "Payments",
  "/landlord/messages": "Messages",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Landlord";
  const userRole = "Landlord";

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
    // fallback to defaults
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar navItems={[...LANDLORD_NAV]} userName={userName} userRole={userRole} />
      <div className="flex flex-1 flex-col min-w-0">
        <AppTopBar titleMap={LANDLORD_TITLES} />
        <main className="flex flex-1 min-h-0 flex-col w-full overflow-hidden bg-card">{children}</main>
      </div>
    </div>
  );
}
