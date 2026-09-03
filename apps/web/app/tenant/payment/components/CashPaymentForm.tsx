"use client";

import { useState } from "react";
import { Button, Calendar, Card, Separator, Label, Popover } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { CalendarIcon } from "lucide-react";
import type { CashPaymentErrors } from "../types";

export function validateCashPayment(data: { paymentDate: Date | null }): CashPaymentErrors {
  const errors: CashPaymentErrors = {};
  if (!data.paymentDate) {
    errors.paymentDate = "Payment date is required";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(data.paymentDate);
    selected.setHours(0, 0, 0, 0);
    if (selected < today) errors.paymentDate = "Payment date cannot be in the past";
  }
  return errors;
}

interface CashPaymentFormProps {
  paymentDate: Date | null;
  onPaymentDateChange: (date: Date) => void;
  errors?: CashPaymentErrors;
}

function toCalendarDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return parseDate(`${y}-${m}-${day}`);
}

function formatDisplay(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export default function CashPaymentForm({ paymentDate, onPaymentDateChange, errors }: CashPaymentFormProps) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mt-5">
      <Separator className="mb-5" />
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cash Payment</h4>
      <p className="text-sm text-zinc-500 mt-1">Please prepare the exact amount in cash and bring it to the property.</p>
      <p className="text-xs text-zinc-500 mt-3">
        After you have made the cash payment, kindly fill out the Cash Payment Confirmation below to confirm.
      </p>

      <div className="mt-4 space-y-1.5">
        <Label className="text-xs text-zinc-600 dark:text-zinc-400">
          Payment Date <span className="text-red-600">*</span>
        </Label>

        <Popover isOpen={open} onOpenChange={setOpen}>
          <Button
            variant="secondary"
            className={`w-full justify-between rounded-xl border bg-white dark:bg-zinc-900 font-normal text-sm ${
              errors?.paymentDate ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
            }`}
            onPress={() => setOpen((v) => !v)}
          >
            <span className={paymentDate ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}>
              {paymentDate ? formatDisplay(paymentDate) : "Select date of payment"}
            </span>
            <CalendarIcon size={16} className="text-zinc-400" />
          </Button>
          <Popover.Content className="p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
            <Calendar
              aria-label="Select payment date"
              // Controlled via value if date exists
              {...(paymentDate ? { value: toCalendarDate(paymentDate) as unknown as never } : {})}
              onChange={(val: unknown) => {
                const iso = (val as { toString?: () => string })?.toString?.() ?? null;
                if (iso) {
                  const [y, m, d] = iso.split("-").map(Number);
                  const picked = new Date(y, m - 1, d);
                  onPaymentDateChange(picked);
                  setOpen(false);
                }
              }}
              className="w-full"
              minValue={toCalendarDate(today) as unknown as never}
            />
          </Popover.Content>
        </Popover>

        {errors?.paymentDate && <p className="text-xs text-red-600">{errors.paymentDate}</p>}
      </div>
    </div>
  );
}


