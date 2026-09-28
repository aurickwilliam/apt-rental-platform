import type { ReactNode } from "react";
import { Card, Chip } from "@heroui/react";

export const dateTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});
export const dateOnly = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export function fullName(
  person: { first_name: string | null; last_name: string | null } | null,
): string {
  return person
    ? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim()
    : "";
}

export function StatusChip({
  status,
  icon,
}: {
  status: string;
  icon?: ReactNode;
}) {
  const color =
    status === "verified" ||
    status === "approved" ||
    status === "resolved" ||
    status === "paid" ||
    status === "occupied" ||
    status === "visible"
      ? "success"
      : status === "rejected" ||
          status === "hidden" ||
          status === "cancelled" ||
          status === "high"
        ? "danger"
        : status === "pending" ||
            status === "in_progress" ||
            status === "rescheduled" ||
            status === "under_maintenance"
          ? "warning"
          : "default";
  return (
    <Chip size="md" variant="soft" color={color} className="capitalize">
      {icon}
      {status.replaceAll("_", " ")}
    </Chip>
  );
}

export function Section({
  title,
  icon,
  headerExtra,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none ${className}`}
    >
      <Card.Content className="p-0">
        <section aria-label={title}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 font-nunito text-lg font-bold text-primary">
              {icon ? (
                <span className="shrink-0" aria-hidden="true">
                  {icon}
                </span>
              ) : null}
              {title}
            </h2>
            {headerExtra ? (
              <span className="shrink-0">{headerExtra}</span>
            ) : null}
          </div>
          <div className="mt-3">{children}</div>
        </section>
      </Card.Content>
    </Card>
  );
}

export function SectionError() {
  return (
    <p role="alert" className="text-sm text-danger">
      This information is unavailable. Refresh and try again.
    </p>
  );
}

export function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <p className="font-nunito text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
