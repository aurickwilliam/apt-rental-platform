"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <Card className={`bg-white/90 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm ${className}`}>
      <Card.Content className="p-4">
        {children}
      </Card.Content>
    </Card>
  );
}
