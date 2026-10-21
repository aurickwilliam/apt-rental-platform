import { formatFinanceMoney, formatPesoDisplay } from "@repo/utils";

export function financeMoney(amount: number): string {
  return formatFinanceMoney(amount, formatPesoDisplay);
}

export default function FinanceMoneyRow({
  label,
  amount,
  emphasized = false,
}: {
  label: string;
  amount: number | null;
  emphasized?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-nunito tabular-nums ${emphasized ? "font-bold text-brand" : "font-semibold text-foreground"}`}
      >
        {amount === null ? "Not calculated" : financeMoney(amount)}
      </span>
    </div>
  );
}
