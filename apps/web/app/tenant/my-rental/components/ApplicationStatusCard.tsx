"use client";

import { Card, Separator } from "@heroui/react";
import Link from "next/link";
import { getApplicationStatusStyle, type ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";
import { formatPesoDisplay } from "@repo/utils";

type Props = {
  id: string;
  status: ApplicationStatus;
  apartmentName: string | null;
  apartmentId: string;
  createdAt: string;
};

function formatLongDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function ApplicationStatusCard({ id, status, apartmentName, apartmentId, createdAt }: Props) {
  const style = getApplicationStatusStyle(status);
  const Icon = style.Icon;

  return (
    <Link href={`/tenant/applications/${id}?apartmentId=${apartmentId}`} className="block">
      <Card className="border border-border bg-card text-card-foreground shadow-none rounded-2xl hover:border-primary/30 transition-colors">
        <Card.Content className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Icon size={28} style={{ color: style.iconColor }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-card-foreground leading-none">{style.label}</p>
              <p className="text-sm font-semibold text-primary truncate">{apartmentName ?? "—"}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-5">{style.description}</p>
          <Separator />
          <p className="text-xs text-muted-foreground">Submitted {formatLongDate(createdAt)}</p>
        </Card.Content>
      </Card>
    </Link>
  );
}
