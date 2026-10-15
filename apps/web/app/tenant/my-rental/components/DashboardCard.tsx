"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <Card className={`border border-border bg-card text-card-foreground rounded-2xl shadow-none ${className}`}>
      <Card.Content className="p-4">
        {children}
      </Card.Content>
    </Card>
  );
}
