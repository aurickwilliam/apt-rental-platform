import type { ReactNode } from "react";
import { Card } from "@heroui/react";

interface FinanceCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Overrides the default vertical rhythm of the card body. */
  contentClassName?: string;
}

export default function FinanceCard({
  title,
  description,
  children,
  action,
  className = "",
  contentClassName = "space-y-4",
}: FinanceCardProps) {
  return (
    <Card className={`finance-card ${className}`}>
      <Card.Header className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <Card.Title className="font-nunito text-lg font-bold">
            {title}
          </Card.Title>
          {description ? (
            <Card.Description className="mt-1 text-sm text-muted-foreground">
              {description}
            </Card.Description>
          ) : null}
        </div>
        {action}
      </Card.Header>
      <Card.Content className={contentClassName}>{children}</Card.Content>
    </Card>
  );
}
