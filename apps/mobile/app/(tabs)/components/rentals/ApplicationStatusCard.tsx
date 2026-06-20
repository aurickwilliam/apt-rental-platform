import { View } from "react-native";
import { useRouter } from "expo-router";

import { Clock, CheckCircle, XCircle } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

import { formatDate } from "@repo/utils";

import { Card, Separator, PressableFeedback } from "heroui-native";

type Props = {
  status: "pending" | "approved" | "rejected";
  apartmentName: string;
  submittedAt: string;
  apartmentId: string;
};

export default function ApplicationStatusCard({
  status,
  apartmentName,
  submittedAt,
  apartmentId,
}: Props) {
  const { colors } = useColors();
  const router = useRouter();

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
    <PressableFeedback
      onPress={() => router.push({
        pathname: '/tenant/applications/[applicationId]',
        params: { applicationId: apartmentId },
      })}
      className="rounded-3xl overflow-hidden"
    >
      <PressableFeedback.Highlight />
      <Card className="shadow-none border border-border overflow-hidden">
        <Card.Body className="gap-3">
          <View className="flex-row items-center gap-3">
            <Icon size={28} color={color} />
            <View className="flex-1">
              <Card.Title className="text-lg text-foreground font-interSemiBold">
                {label}
              </Card.Title>
              <Card.Description className="text-sm text-secondary font-inter">
                {apartmentName}
              </Card.Description>
            </View>
          </View>

          <Card.Description className="text-sm font-inter leading-5">
            {description}
          </Card.Description>

          <Separator className="my-1" />

          <Card.Description className="text-xs font-inter">
            Submitted {formatDate(submittedAt, "long")}
          </Card.Description>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}