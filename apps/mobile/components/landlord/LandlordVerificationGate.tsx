import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { Button } from "heroui-native";
import { IconShieldCheck } from "@tabler/icons-react-native";
import {
  getLandlordAccessState,
  isLandlordAccessBlocked,
  LANDLORD_VERIFICATION_MESSAGE,
} from "@repo/utils";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useHasActiveTenancy } from "@/hooks/landlord/useHasActiveTenancy";
import { useColors } from "@/hooks/useTheme";

const PROFILE_ROUTE = "/(tabs)/(landlord)/profile";

// The screens a running tenancy keeps open (confirming cash, answering
// maintenance); the database refuses everything not tied to that tenancy.
const TENANCY_ROUTES = [
  { label: "Payments", href: "/landlord/payments", segment: "payments" },
  { label: "Maintenance requests", href: "/landlord/maintenance-requests", segment: "maintenance-requests" },
] as const;

const COPY = {
  pending: {
    title: "Your verification is under review",
    body: "Landlord tools open as soon as APT approves your account.",
    action: "View verification status",
  },
  unverified: {
    title: "Verify your account to continue",
    body: "Listings, applications, tenants, payments and messages are available to verified landlords only.",
    action: "Verify my account",
  },
} as const;

/**
 * Replaces a landlord screen until the account is verified, so the screen's
 * own queries and realtime channels never start. The database refuses the same
 * actions; this explains the rule. While the profile loads, children render:
 * the database, not this gate, is the authority.
 */
export default function LandlordVerificationGate({
  children,
  allowTenancyScreens = false,
}: {
  children: ReactNode;
  /** Set on the landlord stack: payments and maintenance stay open during a tenancy. */
  allowTenancyScreens?: boolean;
}) {
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useColors();
  const { data: profile } = useCurrentUser();
  const blocked = !!profile && isLandlordAccessBlocked(profile.roles, profile.account_status);
  const hasActiveTenancy = useHasActiveTenancy(profile?.id ?? null, blocked);

  if (!profile || !blocked) {
    return <>{children}</>;
  }
  if (allowTenancyScreens && hasActiveTenancy && TENANCY_ROUTES.some((route) => route.segment === segments[1])) {
    return <>{children}</>;
  }

  const copy = COPY[getLandlordAccessState(profile.account_status) === "pending" ? "pending" : "unverified"];

  return (
    <ScreenWrapper>
      <View
        accessibilityRole="alert"
        accessibilityLabel={LANDLORD_VERIFICATION_MESSAGE}
        className="flex-1 items-center justify-center gap-4 px-6"
      >
        <View className="bg-gray-100 rounded-full p-6">
          <IconShieldCheck size={44} color={colors.gray500} />
        </View>
        <View className="items-center gap-1">
          <Text className="text-foreground text-lg font-nunitoSemiBold text-center">{copy.title}</Text>
          <Text className="text-gray-400 text-sm font-inter text-center">{copy.body}</Text>
        </View>
        <Button onPress={() => router.navigate(PROFILE_ROUTE)}>
          <Button.Label>{copy.action}</Button.Label>
        </Button>
        {hasActiveTenancy ? (
          <View className="items-center gap-2">
            <Text className="text-gray-400 text-sm font-inter text-center">
              You can still manage your current tenancy:
            </Text>
            {TENANCY_ROUTES.map((route) => (
              <Button key={route.href} variant="secondary" onPress={() => router.navigate(route.href)}>
                <Button.Label>{route.label}</Button.Label>
              </Button>
            ))}
          </View>
        ) : null}
      </View>
    </ScreenWrapper>
  );
}
