import { Text, View } from "react-native";
import { Button, Card, Spinner } from "heroui-native";
import { IconReceipt, IconTool } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";
import MaintenanceSectionHeading from "./MaintenanceSectionHeading";

interface MaintenanceOverviewProps {
  data?: { activeCount: number; unpaidFees: number; hasActiveTenancy: boolean };
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export default function MaintenanceOverview({ data, loading, error, onRetry }: MaintenanceOverviewProps) {
  const { colors } = useColors();
  const panels = [
    { title: "Active requests", Icon: IconTool, value: String(data?.activeCount ?? "—"), highlighted: true },
    { title: "Unpaid maintenance fees", Icon: IconReceipt, value: data ? `₱${data.unpaidFees.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—", highlighted: false },
  ];
  return (
    <Card className="rounded-3xl border border-border bg-overlay shadow-none">
      <Card.Body className="gap-4">
        <MaintenanceSectionHeading kind="overview" />
        {loading ? (
          <Spinner accessibilityLabel="Loading maintenance overview" />
        ) : error ? (
          <View className="gap-3">
            <Text accessibilityRole="alert" className="font-inter text-sm text-danger">Couldn&apos;t load the overview.</Text>
            <Button variant="secondary" size="sm" onPress={onRetry}><Button.Label>Retry overview</Button.Label></Button>
          </View>
        ) : (
            <View className="flex-row items-stretch gap-3">
              {panels.map(({ title, Icon, value, highlighted }) => (
                <View key={title} className="min-w-0 flex-1 gap-3 rounded-2xl border border-border bg-surface p-3">
                  <View className="flex-row items-start gap-2">
                    <View className="size-5 shrink-0"><Icon size={20} color={colors.primaryLightForeground} /></View>
                    <Text className="min-w-0 flex-1 font-nunitoSemiBold text-sm text-foreground">{title}</Text>
                  </View>
                  <Text
                    selectable
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    className={`mt-auto max-w-full self-start py-2 font-nunitoBold text-xl text-primary-light-foreground${highlighted ? " rounded-xl bg-primary-light px-2" : ""}`}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
        )}
      </Card.Body>
    </Card>
  );
}
