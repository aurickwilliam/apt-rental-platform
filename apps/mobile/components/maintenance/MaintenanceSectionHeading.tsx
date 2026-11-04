import { Text, View } from "react-native";
import { IconChartBar, IconHistory, IconTool } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";

interface MaintenanceSectionHeadingProps {
  kind: "active" | "overview" | "history";
}

export default function MaintenanceSectionHeading({ kind }: MaintenanceSectionHeadingProps) {
  const { colors } = useColors();
  const Icon = kind === "active" ? IconTool : kind === "overview" ? IconChartBar : IconHistory;
  const title = kind === "active" ? "Active maintenance requests" : kind === "overview" ? "Overview" : "Maintenance request history";
  return (
    <View className="flex-row items-start gap-3">
      <View className="size-10 items-center justify-center rounded-2xl bg-primary-light">
        <Icon size={22} color={colors.primaryLightForeground} />
      </View>
      <View className="flex-1 gap-1">
        <Text accessibilityRole="header" className="font-nunitoBold text-lg text-foreground">{title}</Text>
        {kind !== "overview" && <Text className="font-inter text-sm text-muted">{kind === "active" ? "Track your pending and in-progress requests." : "Review your resolved and cancelled requests."}</Text>}
      </View>
    </View>
  );
}
