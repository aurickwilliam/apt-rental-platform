"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { formatPesoDisplay } from "../utils";

interface PaymentFooterProps {
  totalPayment: number;
  onPayPress: () => void;
  isProcessing?: boolean;
  isDisabled?: boolean;
}

export default function PaymentFooter({ totalPayment, onPayPress, isProcessing = false, isDisabled = false }: PaymentFooterProps) {
  return (
    <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
      <Card.Content className="p-4 flex flex-row items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">Total Rent Due</p>
          <p className="text-xl font-nunito font-bold text-primary truncate">{formatPesoDisplay(totalPayment)}</p>
        </div>
        <Button onPress={onPayPress} isDisabled={isDisabled || isProcessing} className="flex-1 sm:flex-none sm:min-w-44 rounded-full font-nunito">
          {isProcessing ? (
            <>
              <Spinner size="sm" color="current" /> Processing…
            </>
          ) : (
            "Pay"
          )}
        </Button>
      </Card.Content>
    </Card>
  );
}
