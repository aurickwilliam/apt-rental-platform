import Link from "next/link";
import { formatDate, formatPesoDisplay, type RentDue } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";

const MAX_ROWS = 6;

type Props = {
  rentDues: RentDue[];
};

export default function RentDueList({ rentDues }: Props) {
  const totalDue = rentDues.reduce((sum, due) => sum + due.amount, 0);
  const visibleDues = rentDues.slice(0, MAX_ROWS);
  const hiddenCount = rentDues.length - visibleDues.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-medium text-foreground">Upcoming rent due</h3>
        <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">
          {formatPesoDisplay(totalDue) || "₱ 0"}
        </span>
      </div>

      {rentDues.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-foreground">No upcoming rent dues</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re all caught up. New dues appear here as they come due.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {visibleDues.map((due) => (
            <li key={due.id}>
              <Link
                href={`/landlord/properties/${due.apartmentId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {due.apartmentName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
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
