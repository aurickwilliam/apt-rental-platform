import { Card } from "@heroui/react";
import type { ReactNode } from "react";
import { numberFormat } from "./analytics-format";

interface SnapshotCardProps {
  title: string;
  value: number;
  valueLabel?: string;
  detail: ReactNode;
}

export default function SnapshotCard({
  title,
  value,
  valueLabel,
  detail,
}: SnapshotCardProps) {
  return (
    <Card className="h-full min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none">
      <Card.Content className="flex h-full flex-col justify-between gap-4 p-0">
        <div>
          <dt className="font-nunito text-sm font-bold text-foreground">
            {title}
          </dt>
          <dd className="mt-2 font-nunito text-3xl font-bold tabular-nums text-primary">
            {numberFormat.format(value)}
            {valueLabel ? (
              <span className="ml-1 text-sm font-semibold text-muted-foreground">
                {valueLabel}
              </span>
            ) : null}
          </dd>
        </div>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </Card.Content>
    </Card>
  );
}
