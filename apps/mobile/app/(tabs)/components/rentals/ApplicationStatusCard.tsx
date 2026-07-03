import { View } from "react-native";
import { useRouter } from "expo-router";

import { formatDate } from "@repo/utils";

import { Card, Separator, PressableFeedback } from "heroui-native";

import {
  useApplicationStatusStyles,
  type ApplicationStatus
} from "@/hooks/applications";

type Props = {
  applicationId: string;
  status: ApplicationStatus;
  apartmentName: string;
  submittedAt: string;
  apartmentId: string;
};

export default function ApplicationStatusCard({
  applicationId,
  status,
  apartmentName,
  submittedAt,
  apartmentId,
}: Props) {
  const router = useRouter();
  const { getStatusStyle } = useApplicationStatusStyles();
  const { label, description, Icon, iconColor } = getStatusStyle(status);

  return (
    <PressableFeedback
      onPress={() => router.push({
        pathname: '/tenant/applications/[applicationId]',
        params: {
          applicationId: applicationId,
          apartmentId: apartmentId
        },
      })}
      className="rounded-3xl overflow-hidden"
    >
      <PressableFeedback.Highlight />
      <Card className="shadow-none border border-border overflow-hidden">
        <Card.Body className="gap-3">
          <View className="flex-row items-center gap-3">
            <Icon size={28} color={iconColor} />
            <View className="flex-1">
              <Card.Title className="text-lg text-foreground font-interSemiBold">
                {label}
              </Card.Title>
              <Card.Description className="text-sm text-accent font-interMedium">
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
