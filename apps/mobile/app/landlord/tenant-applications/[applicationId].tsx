import { useMemo } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Avatar, Card, Chip } from "heroui-native";

import { IconFileText, IconHome } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

import { COLORS } from "@repo/constants";
import { formatCurrency, formatDate } from "@repo/utils";

import {
  TENANT_APPLICATIONS,
  type TenantApplication,
  type TenantApplicationStatus,
} from "./mockData";

const STATUS_STYLES: Record<
  TenantApplicationStatus,
  { backgroundColor: string; textColor: string }
> = {
  Applied: {
    backgroundColor: COLORS.lightYellowish,
    textColor: COLORS.yellowish,
  },
  "Under Review": {
    backgroundColor: COLORS.lightBlue,
    textColor: COLORS.primary,
  },
  Approved: {
    backgroundColor: COLORS.lightGreen,
    textColor: COLORS.greenHulk,
  },
  Rejected: {
    backgroundColor: COLORS.lightLightRedHead,
    textColor: COLORS.lightRedHead,
  },
};

const getInitials = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "U";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatDateValue = (value: string) => {
  const formatted = formatDate(value, "medium");
  return formatted || "-";
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-grey-500 text-xs font-inter">{label}</Text>
      <Text className="text-text text-sm font-interMedium text-right flex-1">
        {value}
      </Text>
    </View>
  );
}

function ApplicationNotFound() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-white rounded-full p-5 mb-4">
        <IconFileText size={32} color={COLORS.grey} />
      </View>
      <Text className="text-text text-lg font-interSemiBold">
        Application not found
      </Text>
      <Text className="text-grey-500 text-sm font-inter text-center mt-1">
        This application may have been removed or is unavailable.
      </Text>
    </View>
  );
}

export default function TenantApplicationDetails() {
  const { applicationId } = useLocalSearchParams<{
    applicationId?: string | string[];
  }>();

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
        backgroundColor={COLORS.darkerWhite}
        scrollable
        className="p-5"
      >
        <ApplicationNotFound />
      </ScreenWrapper>
    );
  }

  const statusStyle = STATUS_STYLES[application.status];

  return (
    <ScreenWrapper
      header={<StandardHeader title="Application Details" />}
      backgroundColor={COLORS.darkerWhite}
      scrollable
      className="p-5"
    >
      <View className="gap-4">
        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 flex-row items-center gap-3">
            <Avatar size="lg" className="border border-secondary">
              <Avatar.Image source={{ uri: application.tenant_avatar_url ?? "" }} />
              <Avatar.Fallback delayMs={200}>
                {getInitials(application.tenant_name)}
              </Avatar.Fallback>
            </Avatar>

            <View className="flex-1 min-w-0">
              <Text className="text-text text-base font-interSemiBold" numberOfLines={1}>
                {application.tenant_name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <IconHome size={14} color={COLORS.grey} />
                <Text
                  className="text-grey-500 text-xs font-inter"
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

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 gap-3">
            <Text className="text-text text-sm font-interSemiBold">
              Application Details
            </Text>
            <DetailRow
              label="Date Submitted"
              value={formatDateValue(application.date_submitted)}
            />
            <DetailRow
              label="Move-in Date"
              value={formatDateValue(application.move_in_date)}
            />
            <DetailRow label="Duration" value={application.duration_stay} />
            <DetailRow
              label="Monthly Income"
              value={`₱ ${formatCurrency(application.monthly_income)}`}
            />
            <DetailRow
              label="No. of Occupants"
              value={`${application.no_occupants}`}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 gap-3">
            <Text className="text-text text-sm font-interSemiBold">Employment</Text>
            <DetailRow label="Occupation" value={application.occupation} />
            <DetailRow label="Employer" value={application.employer_name} />
            <DetailRow
              label="Employment Type"
              value={application.employment_type}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 gap-3">
            <Text className="text-text text-sm font-interSemiBold">Preferences</Text>
            <DetailRow label="Has Pets" value={application.has_pets ? "Yes" : "No"} />
            <DetailRow
              label="Has Smoker"
              value={application.has_smoker ? "Yes" : "No"}
            />
            <DetailRow
              label="Needs Parking"
              value={application.need_parking ? "Yes" : "No"}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 gap-3">
            <Text className="text-text text-sm font-interSemiBold">
              Previous Landlord
            </Text>
            <DetailRow
              label="Name"
              value={application.prev_landlord_name || "Not provided"}
            />
            <DetailRow
              label="Contact"
              value={application.prev_landlord_contact || "Not provided"}
            />
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="p-4 gap-2">
            <Text className="text-text text-sm font-interSemiBold">Message</Text>
            <Text className="text-grey-500 text-sm font-inter">
              {application.message || "No message provided."}
            </Text>
          </Card.Body>
        </Card>
      </View>
    </ScreenWrapper>
  );
}
