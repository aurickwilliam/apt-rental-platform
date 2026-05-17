"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <Card className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl ${className}`}>
      <Card.Content className="p-4">
        {children}
      </Card.Content>
    </Card>
  );
}
