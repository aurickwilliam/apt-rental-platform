"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

// The surface every My Rental section shares: mobile's 24px-radius,
// hairline-bordered card. HeroUI's Card already pads its body by 16px.
export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <Card className={`min-w-0 border border-border bg-card text-card-foreground rounded-3xl shadow-none ${className}`}>
      <Card.Content className="@container/dashboard min-w-0">
        {children}
      </Card.Content>
    </Card>
  );
}
