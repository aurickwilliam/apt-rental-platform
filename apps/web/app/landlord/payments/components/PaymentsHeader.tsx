"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { IconArrowLeft, IconCashBanknote } from "@tabler/icons-react";

export default function PaymentsHeader({ children }: { children?: ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" size="sm" onPress={() => router.back()} className="w-fit">
        <IconArrowLeft size={16} /> Back
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconCashBanknote size={22} className="text-primary" /> Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Payments for this unit will appear here.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
