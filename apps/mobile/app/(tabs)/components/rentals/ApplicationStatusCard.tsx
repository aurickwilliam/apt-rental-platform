import { View, Text } from "react-native";
import { Clock, CheckCircle, XCircle } from "lucide-react-native";
import { useColors } from "@/hooks/useTheme";
import { formatDate } from "@repo/utils";

type Props = {
  status: "pending" | "approved" | "rejected";
  apartmentName: string;
  submittedAt: string;
};

export default function ApplicationStatusCard({
  status,
  apartmentName,
  submittedAt,
}: Props) {
  const { colors } = useColors();

  const STATUS_CONFIG = {
    pending: {
      label: "Under Review",
      description:
        "Your application is being reviewed by the landlord. We'll notify you once there's an update.",
      Icon: Clock,
      color: colors.warning
    },
    approved: {
      label: "Approved",
      description:
        "Your application has been approved! The landlord will reach out to finalize your lease.",
      Icon: CheckCircle,
      color: colors.success
    },
    rejected: {
      label: "Not Approved",
      description: "Unfortunately, your application was not approved this time.",
      Icon: XCircle,
      color: colors.danger
    },
  };
  
  const { label, description, Icon, color } = STATUS_CONFIG[status];

  return (
    <View className="rounded-2xl border border-default-200 bg-content1 p-5 gap-4">
      <View className="flex-row items-center gap-3">
        <Icon size={28} color={color} />
        <View className="flex-1">
          <Text className="text-foreground text-lg font-interSemiBold">
            {label}
          </Text>
          <Text className="text-secondary text-sm font-inter">
            {apartmentName}
          </Text>
        </View>
      </View>

      <Text className="text-muted text-sm font-inter leading-5">
        {description}
      </Text>

      <View className="border-t border-default-100 pt-3">
        <Text className="text-default-400 text-xs font-inter">
          Submitted {formatDate(submittedAt, "long")}
        </Text>
      </View>
    </View>
  );
}