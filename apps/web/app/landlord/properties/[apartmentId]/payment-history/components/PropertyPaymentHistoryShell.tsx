"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { IconArrowLeft, IconCashBanknote } from "@tabler/icons-react";

interface PropertyPaymentHistoryShellProps {
  apartmentId?: string;
  apartmentName?: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}

export default function PropertyPaymentHistoryShell({ apartmentId, apartmentName, controls, children }: PropertyPaymentHistoryShellProps) {
  const router = useRouter();
  const params = useParams<{ apartmentId: string }>();
  const id = apartmentId ?? params.apartmentId;
  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto w-full">
      <Button variant="outline" size="sm" onPress={() => router.push(id ? `/landlord/properties/${id}` : "/landlord/properties")} className="w-fit">
        <IconArrowLeft size={16} /> Back to Property
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><IconCashBanknote size={22} className="text-primary" /> Payment History</h1>
          <p className="text-sm text-muted-foreground mt-1 min-h-5">{apartmentName}</p>
        </div>
        {controls}
      </div>
      {children}
    </div>
  );
}
