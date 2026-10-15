import { IconFlag } from "@tabler/icons-react";
import type { UserReportStatusFilter } from "@/lib/user-reports";

export default function ReportsEmptyState({ status }: { status: UserReportStatusFilter }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="rounded-full bg-muted p-5">
        <IconFlag size={36} className="text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-nunito text-lg font-bold">
          {status === "open" ? "No open reports" : "No reports here"}
        </p>
        <p className="text-sm text-muted-foreground">
          Reports people send from Messages will appear here for review.
        </p>
      </div>
    </div>
  );
}
