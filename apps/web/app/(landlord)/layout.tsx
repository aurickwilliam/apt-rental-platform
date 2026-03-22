import LandlordSidebar from "../components/layout/LandlordSidebar";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <LandlordSidebar />

      <main className="bg-white min-h-screen w-full rounded-xl p-4">
        {children}
      </main>
    </SidebarProvider>
  );
}
