import type { Icon } from "@tabler/icons-react";

import EmptyState from "@/app/components/display/EmptyState";

export function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium wrap-break-word">{value}</dd>
    </div>
  );
}

export function MetricItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-nunito text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function DetailEmptyState({
  icon,
  title,
  description,
}: {
  icon: Icon;
  title: string;
  description?: string;
}) {
  return (
    <EmptyState className="mt-2 py-8" icon={icon} title={title} description={description} />
  );
}
