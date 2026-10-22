import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export default function ApplicationDetailShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0 p-4 md:p-6 flex flex-col gap-4 bg-card min-h-0">
      <div>
        <Link href="/landlord/applications" className="inline-flex h-8 items-center gap-2 text-sm text-muted-foreground hover:text-primary"><IconArrowLeft size={16} aria-hidden="true" /> Back to Applications</Link>
        <h1 className="mt-2 text-2xl font-nunito font-bold text-card-foreground">Application Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review the tenant&apos;s information and supporting documents.</p>
      </div>
      {children}
    </div>
  );
}
