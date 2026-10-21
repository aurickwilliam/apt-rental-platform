import type { PropertyPerformanceMetric } from "@repo/utils";
import FinanceTabs from "./FinanceTabs";

export type { PropertyPerformanceMetric };

const METRIC_OPTIONS: { value: PropertyPerformanceMetric; label: string }[] = [
  { value: "collected", label: "Collected" },
  { value: "expenses", label: "Expenses" },
  { value: "net", label: "Net income" },
];

interface PropertyPerformanceTabsProps {
  value: PropertyPerformanceMetric;
  onChange: (value: PropertyPerformanceMetric) => void;
}

export default function PropertyPerformanceTabs({
  value,
  onChange,
}: PropertyPerformanceTabsProps) {
  return (
    <FinanceTabs
      value={value}
      onChange={(nextValue) => onChange(nextValue as PropertyPerformanceMetric)}
      options={METRIC_OPTIONS}
    />
  );
}
