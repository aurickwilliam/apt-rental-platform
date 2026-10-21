import { Tabs } from "heroui-native";

interface FinanceTabsProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export default function FinanceTabs({
  value,
  options,
  onChange,
}: FinanceTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange} variant="primary">
      <Tabs.List>
        <Tabs.Indicator />
        {options.map((option) => (
          <Tabs.Trigger
            key={option.value}
            value={option.value}
            className="flex-1"
          >
            <Tabs.Label>{option.label}</Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
