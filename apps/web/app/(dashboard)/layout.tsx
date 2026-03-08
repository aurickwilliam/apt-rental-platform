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
        <main>
          <SidebarTrigger className="p-4"/>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
