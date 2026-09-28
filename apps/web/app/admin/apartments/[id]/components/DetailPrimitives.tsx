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

export function StatusChip({ status }: { status: string }) {
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
    <Chip size="sm" variant="soft" color={color} className="capitalize">
      {status.replaceAll("_", " ")}
    </Chip>
  );
}

export function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none ${className}`}
    >
      <Card.Content className="p-0">
        <section aria-label={title}>
          <h2 className="font-nunito text-lg font-bold text-primary">
            {title}
          </h2>
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
