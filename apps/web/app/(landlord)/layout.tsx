import LandlordSidebar from "../components/layout/LandlordSidebar";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <LandlordSidebar />

      <SidebarInset>
        <main className="bg-white min-h-screen rounded-xl p-4">
          <SidebarTrigger/>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
