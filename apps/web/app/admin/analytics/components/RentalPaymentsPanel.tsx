"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PaymentTrend } from "../types";
import {
  bucketDateLabel,
  compactMoneyFormat,
  moneyFormat,
  numberFormat,
  shortDate,
} from "./analytics-format";
import Panel from "./Panel";

const paymentConfig = {
  payment_total: {
    label: "Successful payment volume",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface RentalPaymentsPanelProps {
  paymentTrends: PaymentTrend[] | null;
  className?: string;
}

export default function RentalPaymentsPanel({
  paymentTrends,
  className,
}: RentalPaymentsPanelProps) {
  const paymentTotal =
    paymentTrends?.reduce((sum, bucket) => sum + bucket.payment_total, 0) ?? 0;
  const paymentCount =
    paymentTrends?.reduce((sum, bucket) => sum + bucket.payment_count, 0) ?? 0;
  return (
    <Panel
      title="Rental Payments"
      description="Payments currently marked paid, by recorded payment date in the selected period (UTC)."
      className={className}
    >
      {paymentTrends === null ? (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          Rental payment data is unavailable. Refresh and try again.
        </p>
      ) : (
        <>
          <p className="mt-4 font-nunito text-3xl font-bold tabular-nums text-primary sm:text-4xl">
            {moneyFormat.format(paymentTotal)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {numberFormat.format(paymentCount)} successful{" "}
            {paymentCount === 1 ? "payment" : "payments"}
          </p>
          {paymentCount > 0 ? (
            <>
              <ChartContainer
                config={paymentConfig}
                className="mt-4 h-52 w-full sm:h-56"
              >
                <LineChart
                  data={paymentTrends}
                  accessibilityLayer
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="bucket_start"
                    tickFormatter={shortDate}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tickFormatter={(value: number) =>
                      compactMoneyFormat.format(value)
                    }
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          bucketDateLabel(
                            payload[0]?.payload as PaymentTrend | undefined,
                          )
                        }
                        formatter={(value, _name, item) => (
                          <span className="flex w-full flex-col gap-1">
                            <span className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Successful payment volume
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {moneyFormat.format(Number(value))}
                              </span>
                            </span>
                            <span className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                Payments
                              </span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {numberFormat.format(
                                  (item.payload as PaymentTrend).payment_count,
                                )}
                              </span>
                            </span>
                          </span>
                        )}
                      />
                    }
                  />
                  <Line
                    dataKey="payment_total"
                    type="linear"
                    stroke="var(--color-payment_total)"
                    strokeWidth={2}
                    dot={paymentTrends.length === 1}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
              <p className="sr-only">
                {paymentTrends
                  .map(
                    (bucket) =>
                      `${bucketDateLabel(bucket)}: ${moneyFormat.format(bucket.payment_total)} across ${bucket.payment_count} successful payments.`,
                  )
                  .join(" ")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Average payment amount{" "}
                <span className="font-nunito font-bold tabular-nums text-foreground">
                  {moneyFormat.format(paymentTotal / paymentCount)}
                </span>
              </p>
            </>
          ) : (
            <p
              className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
              role="status"
            >
              No successful payments recorded in this period.
            </p>
          )}
        </>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Recorded rental payment volume, not APT platform revenue.
      </p>
    </Panel>
  );
}
