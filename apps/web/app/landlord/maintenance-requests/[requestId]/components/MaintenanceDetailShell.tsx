import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export default function MaintenanceDetailShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full px-3 py-3 flex flex-col gap-3 bg-card">
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/landlord/maintenance-requests" className="inline-flex h-8 items-center gap-1 text-sm text-muted-foreground hover:text-primary"><IconArrowLeft size={16} aria-hidden="true" /> Back</Link>
        <h1 className="text-xl font-nunito font-semibold text-card-foreground">Maintenance Request</h1>
      </div>
      {children}
    </div>
  );
}
