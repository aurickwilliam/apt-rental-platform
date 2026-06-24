import { useMemo } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Avatar, Card, Chip } from "heroui-native";

import { Home } from "lucide-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import EmptyApplicationData from "./components/EmptyApplicationData";

import { formatCurrency, formatDate } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";

import {
  TENANT_APPLICATIONS,
  type TenantApplication,
  type TenantApplicationStatus,
} from "./mockData";

const getInitials = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "U";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function TenantApplicationDetails() {
  const { applicationId } = useLocalSearchParams<{
    applicationId?: string | string[];
  }>();

  const { colors } = useColors();

  const resolvedId = useMemo(
    () => (Array.isArray(applicationId) ? applicationId[0] : applicationId),
    [applicationId]
  );

  const application = useMemo<TenantApplication | undefined>(() => {
    if (!resolvedId) return undefined;
    return TENANT_APPLICATIONS.find((entry) => entry.id === resolvedId);
  }, [resolvedId]);

  if (!application) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Application Details" />}
        backgroundColor={colors.surface}
        scrollable
        className="p-5"
      >
        <EmptyApplicationData />
      </ScreenWrapper>
    );
  }

  const STATUS_STYLES: Record<
    TenantApplicationStatus,
    { backgroundColor: string; textColor: string }
  > = {
    Applied: {
      backgroundColor: colors.warningLight,
      textColor: colors.warning,
    },
    "Under Review": {
      backgroundColor: colors.primaryLight,
      textColor: colors.primary,
    },
    Approved: {
      backgroundColor: colors.successLight,
      textColor: colors.success,
    },
    Rejected: {
      backgroundColor: colors.dangerLight,
      textColor: colors.danger,
    },
  };

  const statusStyle = STATUS_STYLES[application.status];

  return (
    <ScreenWrapper
      header={<StandardHeader title="Application Details" />}
      scrollable
      className="p-5"
    >
      <View className="gap-4">
        <Card className="shadow-none border border-border">
          <Card.Body className="p-4 flex-row items-center gap-3">
            <Avatar size="lg" className="border border-secondary">
              <Avatar.Image source={{ uri: application.tenant_avatar_url ?? "" }} />
              <Avatar.Fallback delayMs={200}>
                {getInitials(application.tenant_name)}
              </Avatar.Fallback>
            </Avatar>

            <View className="flex-1 min-w-0">
              <Text className="text-foreground text-base font-interSemiBold" numberOfLines={1}>
                {application.tenant_name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Home size={14} color={colors.gray500} />
                <Text
                  className="text-gray-500 text-xs font-inter"
                  numberOfLines={1}
                >
                  {application.apartment_name}
                </Text>
              </View>
            </View>

            <Chip
              size="sm"
              variant="soft"
              style={{ backgroundColor: statusStyle.backgroundColor }}
            >
              <Chip.Label
                className="font-interMedium"
                style={{ color: statusStyle.textColor }}
              >
                {application.status}
              </Chip.Label>
            </Chip>
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-border">
          <Card.Body className="p-4 gap-3">
            <Text className="text-foreground text-sm font-interSemiBold">
              Application Details
            </Text>
            <DetailField
              label="Date Submitted"
              value={formatDate(application.date_submitted, "medium")}
            />
            <DetailField
              label="Move-in Date"
              value={formatDate(application.move_in_date, "medium")}
            />
            <DetailField label="Duration" value={application.duration_stay} />
            <DetailField
              label="Monthly Income"
              value={`₱ ${formatCurrency(application.monthly_income)}`}
            />
            <DetailField
              label="No. of Occupants"
              value={`${application.no_occupants}`}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 gap-3">
            <Text className="text-foreground text-sm font-interSemiBold">Employment</Text>
            <DetailField label="Occupation" value={application.occupation} />
            <DetailField label="Employer" value={application.employer_name} />
            <DetailField
              label="Employment Type"
              value={application.employment_type}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-border">
          <Card.Body className="p-4 gap-3">
            <Text className="text-foreground text-sm font-interSemiBold">Preferences</Text>
            <DetailField label="Has Pets" value={application.has_pets ? "Yes" : "No"} />
            <DetailField
              label="Has Smoker"
              value={application.has_smoker ? "Yes" : "No"}
            />
            <DetailField
              label="Needs Parking"
              value={application.need_parking ? "Yes" : "No"}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-border">
          <Card.Body className="p-4 gap-3">
            <Text className="text-foreground text-sm font-interSemiBold">
              Previous Landlord
            </Text>
            <DetailField
              label="Name"
              value={application.prev_landlord_name || "Not provided"}
            />
            <DetailField
              label="Contact"
              value={application.prev_landlord_contact || "Not provided"}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-border">
          <Card.Body className="p-4 gap-2">
            <Text className="text-foreground text-sm font-interSemiBold">Message</Text>
            <Text className="text-gray-500 text-sm font-inter">
              {application.message || "No message provided."}
            </Text>
          </Card.Body>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
