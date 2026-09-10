"use client";

import { useState } from "react";
import { Button, Calendar, Separator, Label, Popover } from "@heroui/react";
import { parseDate, type CalendarDate } from "@internationalized/date";
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

  // NOTE: open state is controlled WITHOUT a manual toggle on the trigger
  // button — Popover (RAC DialogTrigger) already toggles on inner presses,
  // so a manual onPress flip would cancel it out and the popover could never
  // open. Control exists only so picking a date can close it.
  const handleSelect = (date: CalendarDate | null) => {
    if (!date) return;
    onPaymentDateChange(new Date(date.year, date.month - 1, date.day));
    setOpen(false);
  };

  return (
    <div className="mt-5">
      <Separator className="mb-5" />
      <h4 className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100">Cash Payment</h4>
      <p className="text-sm text-zinc-500 mt-1">Please prepare the exact amount in cash and bring it to the property.</p>
      <p className="text-xs text-zinc-500 mt-3">
        After you have made the cash payment, kindly fill out the Cash Payment Confirmation below to confirm.
      </p>

      <div className="mt-4 space-y-1.5">
        <Label className="text-xs text-zinc-600 dark:text-zinc-400">
          Payment Date <span className="text-red-600">*</span>
        </Label>

        <Popover isOpen={open} onOpenChange={setOpen}>
          <Popover.Trigger>
            <Button
              variant="secondary"
              className={`w-full justify-between rounded-xl border bg-white dark:bg-zinc-900 font-normal text-sm ${
                errors?.paymentDate ? "border-red-500" : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className={paymentDate ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}>
                {paymentDate ? formatDisplay(paymentDate) : "Select date of payment"}
              </span>
              <CalendarIcon size={16} className="text-zinc-400" />
            </Button>
          </Popover.Trigger>
          <Popover.Content
            placement="bottom"
            className="p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg w-[280px]"
          >
            <Popover.Dialog>
              <Calendar
                aria-label="Select payment date"
                value={paymentDate ? toCalendarDate(paymentDate) : null}
                onChange={handleSelect}
                minValue={toCalendarDate(today)}
                style={{ width: 264 }}
              >
                <Calendar.Header>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => (
                      <Calendar.Cell
                        date={date}
                        className="data-selected:bg-primary data-selected:text-white"
                      />
                    )}
                  </Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>

        {errors?.paymentDate && <p className="text-xs text-red-600">{errors.paymentDate}</p>}
      </div>
    </div>
  );
}
