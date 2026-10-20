import { Text } from "react-native";
import { Button } from "heroui-native";
import { IconCheck } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";
import type { FinanceProperty } from "@/service/finance/financeService";

interface FinanceFilterPropertyListProps {
  properties: FinanceProperty[];
  search: string;
  apartmentId: string | null;
  onChange: (apartmentId: string | null) => void;
}

export default function FinanceFilterPropertyList({
  properties,
  search,
  apartmentId,
  onChange,
}: FinanceFilterPropertyListProps) {
  const { colors } = useColors();
  const searchTerm = search.trim().toLocaleLowerCase();
  const options = [{ id: null, name: "All properties" }, ...properties].filter(
    (property) =>
      property.id === null ||
      property.name.toLocaleLowerCase().includes(searchTerm),
  );
  return (
    <>
      {options.map((item) => (
        <Button
          key={item.id ?? "all"}
          variant="ghost"
          accessibilityRole="radio"
          accessibilityState={{ checked: item.id === apartmentId }}
          accessibilityLabel={`Property: ${item.name}`}
          className={`h-auto min-h-12 py-3 justify-start${item.id === apartmentId ? " bg-primary-light" : ""}`}
          onPress={() => onChange(item.id)}
        >
          <Button.Label
            className={`flex-1${item.id === apartmentId ? " text-primary-light-foreground" : ""}`}
            numberOfLines={2}
          >
            {item.name}
          </Button.Label>
          {item.id === apartmentId && (
            <IconCheck
              accessible={false}
              size={18}
              color={colors.primaryLightForeground}
            />
          )}
        </Button>
      ))}
      {searchTerm && options.length === 1 ? (
        <Text className="py-4 font-inter text-sm text-muted">
          No matching properties.
        </Text>
      ) : null}
    </>
  );
}
