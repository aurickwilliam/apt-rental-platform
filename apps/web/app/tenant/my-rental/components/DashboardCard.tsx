"use client";

import type { ReactNode } from "react";
import { Card, CardBody } from "@heroui/react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <Card shadow="none" className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl ${className}`}>
      <CardBody className="p-4">{children}</CardBody>
    </Card>
  );
}
