"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { IconArrowLeft as ArrowLeft } from "@tabler/icons-react";

/**
 * Page frame shared by the payment page, its loading state, and the route
 * skeleton so nothing moves between them. Same idea as PassportPageLayout.
 */
export function PaymentPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="px-4 py-6 sm:py-8 space-y-4">{children}</div>
    </div>
  );
}

export function PaymentPageHeader() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" size="sm" onPress={() => router.back()} className="w-fit">
        <ArrowLeft size={16} /> Back
      </Button>
      <div>
        <h1 className="text-2xl sm:text-3xl font-nunito font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Rent Payment</h1>
        <p className="text-sm text-zinc-500 mt-1">Review your lease, choose a method, and pay.</p>
      </div>
    </div>
  );
}
