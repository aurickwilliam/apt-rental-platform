import Link from "next/link";
import { Card } from "@heroui/react";
import type { Icon } from "@tabler/icons-react";

interface PlatformTotalCardProps {
  label: string;
  value: number | null;
  href: string;
  icon: Icon;
  primary?: boolean;
}

export default function PlatformTotalCard({
  label,
  value,
  href,
  icon: Icon,
  primary = false,
}: PlatformTotalCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Card
        className={`h-28 rounded-3xl border p-4 shadow-none transition-colors ${primary ? "border-primary bg-primary text-white group-hover:bg-primary/90" : "border-border bg-card group-hover:border-primary"}`}
      >
        <Card.Content className="flex h-full flex-col justify-between gap-3 p-0">
          <span className="flex items-center gap-3">
            <span
              className={`flex size-8 items-center justify-center rounded-lg ${primary ? "bg-white/20" : "bg-primary/10 text-primary"}`}
            >
              <Icon size={18} aria-hidden="true" />
            </span>
            <span
              className={`font-nunito text-sm font-semibold ${primary ? "text-white" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </span>
          <span className="font-nunito text-3xl font-bold tabular-nums">
            {value === null ? "—" : value.toLocaleString("en-PH")}
          </span>
        </Card.Content>
      </Card>
    </Link>
  );
}
