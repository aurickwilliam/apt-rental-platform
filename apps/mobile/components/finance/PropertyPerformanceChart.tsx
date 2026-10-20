import { useState } from "react";
import { Button } from "heroui-native";
import FinanceCard from "./FinanceCard";
import FinanceHeading from "./FinanceHeading";
import PropertyPerformanceTabs, {
  type PropertyPerformanceMetric,
} from "./PropertyPerformanceTabs";
import PropertyPerformanceList from "./PropertyPerformanceList";
import type { PropertyPerformance } from "@/service/finance/financeService";

export default function PropertyPerformanceChart({
  properties,
  onSelect,
  onViewAll,
}: {
  properties: PropertyPerformance[];
  onSelect: (id: string) => void;
  onViewAll: () => void;
}) {
  const [metric, setMetric] = useState<PropertyPerformanceMetric>("collected");
  return (
    <FinanceCard>
      <FinanceHeading
        title="Property performance"
        description="Tap a property to focus the whole report."
      />
      <PropertyPerformanceTabs value={metric} onChange={setMetric} />
      <PropertyPerformanceList
        properties={properties}
        metric={metric}
        onSelect={onSelect}
        limit={3}
      />
      {properties.length > 3 && (
        <Button variant="tertiary" size="sm" onPress={onViewAll}>
          <Button.Label>View all {properties.length} properties</Button.Label>
        </Button>
      )}
    </FinanceCard>
  );
}
