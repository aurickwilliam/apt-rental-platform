import Link from "next/link";
import { IconCalendarCheck } from "@tabler/icons-react";
import { formatDate, formatPesoDisplay, type RentDue } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";
import ChartEmptyState from "./ChartEmptyState";

const MAX_ROWS = 8;

type Props = {
  rentDues: RentDue[];
  /** Layout classes from the parent grid. */
  className?: string;
};

export default function RentDueList({ rentDues, className = "" }: Props) {
  const totalDue = rentDues.reduce((sum, due) => sum + due.amount, 0);
  const visibleDues = rentDues.slice(0, MAX_ROWS);
  const hiddenCount = rentDues.length - visibleDues.length;

  return (
    <div className={`flex flex-col rounded-3xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-nunito text-xl font-bold text-primary">Upcoming rent due</h3>
        <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
          {formatPesoDisplay(totalDue) || "₱ 0"}
        </span>
      </div>

      {rentDues.length === 0 ? (
        <ChartEmptyState
          icon={IconCalendarCheck}
          title="No upcoming rent dues"
          description="You're all caught up. New dues appear here as they come due."
          className="flex-1 py-8"
        />
      ) : (
        <ul className="space-y-1">
          {visibleDues.map((due) => (
            <li key={due.id}>
              <Link
                href={`/landlord/properties/${due.apartmentId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium text-foreground">
                    {due.apartmentName}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {due.tenantName} · Due {formatDate(due.dueDate, "medium")}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`text-sm font-semibold ${due.isOverdue ? "text-destructive" : "text-foreground"}`}
                  >
                    {formatPesoDisplay(due.amount)}
                  </span>
                  {due.isOverdue ? <StatusChip tone="danger">Overdue</StatusChip> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 ? (
        <Link
          href="/landlord/payments"
          className="mt-3 inline-block cursor-pointer text-sm font-medium text-primary hover:underline"
        >
          View {hiddenCount} more in Payments
        </Link>
      ) : null}
    </div>
  );
}
