import { Card } from "@heroui/react";
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  headerAccessory?: ReactNode;
}

export default function Panel({
  title,
  description,
  children,
  className = "",
  headerAccessory,
}: PanelProps) {
  return (
    <Card
      className={`h-full min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5 ${className}`}
    >
      <Card.Content className="p-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-nunito text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {headerAccessory}
        </div>
        {children}
      </Card.Content>
    </Card>
  );
}
