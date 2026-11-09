import { View, Text, Linking } from "react-native";
import { Image } from "expo-image";
import * as Updates from "expo-updates";

import { IconEye, IconMapPin, IconTarget } from "@tabler/icons-react-native";

import {
  ABOUT_COVERAGE,
  ABOUT_MISSION,
  ABOUT_OFFICE_ADDRESS,
  ABOUT_STATS,
  ABOUT_VISION,
  TEAM_MEMBERS,
  type TeamMember,
} from "@repo/constants";

import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

import { useColors } from "@/hooks/useTheme";
import { getInstalledAppVersion } from "@/service/appRelease/appReleaseService";
import { describeRunningBuild } from "@/service/appRelease/otaUpdateService";

import TeamMemberCard from "@/components/about/TeamMemberCard";

import { Separator, useToast } from "heroui-native";

// The version baked into this build; it was a stale hard-coded "1.0.0".
const APP_VERSION = getInstalledAppVersion() ?? "Unknown";
const RUNNING_BUILD = describeRunningBuild({
  isEnabled: Updates.isEnabled,
  isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  updateId: Updates.updateId,
  channel: Updates.channel,
});

const TEAM_PHOTOS: Record<TeamMember["id"], number> = {
  aurick: require("@/assets/images/team/orik.webp"),
  mhart: require("@/assets/images/team/ron.webp"),
  michael: require("@/assets/images/team/mija.webp"),
  charle: require("@/assets/images/team/charle.webp"),
};

interface PurposeCardProps {
  icon: typeof IconTarget;
  eyebrow: string;
  title: string;
  body: string;
  iconColor: string;
}

function PurposeCard({ icon: Icon, eyebrow, title, body, iconColor }: PurposeCardProps) {
  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-3">
        <Icon size={20} color={iconColor} />
      </View>
      <Text className="text-xs font-nunitoBold uppercase tracking-widest text-accent mb-1">
        {eyebrow}
      </Text>
      <Text className="text-base font-nunitoBold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted leading-5">{body}</Text>
    </View>
  );
}

export default function AboutScreen() {
  const { colors } = useColors();
  const { toast } = useToast();

  const handleLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.show({ variant: "danger", label: "Couldn't open the link" });
    }
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="About Us" />}
      scrollable
      className="px-5"
    >
      {/* App info */}
      <View className="items-center pt-8 pb-6">
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 80, height: 80, borderRadius: 20 }}
          contentFit="contain"
        />
        <Text className="mt-4 text-2xl font-nunitoBold text-foreground">APT</Text>
        <Text className="text-muted text-sm mt-1">A Place to Thrive</Text>
        <View className="mt-3 px-3 py-1 rounded-full bg-primary/10">
          <Text className="text-accent text-xs font-nunitoSemiBold">
            Version {APP_VERSION}
          </Text>
        </View>
        {RUNNING_BUILD ? (
          <Text className="mt-2 text-xs text-muted">{RUNNING_BUILD}</Text>
        ) : null}
      </View>

      {/* Description */}
      <View className="mb-5">
        <Text className="text-sm text-muted leading-6 text-center">
          APT is a rental platform built for the Philippines, starting with
          Caloocan, Malabon, Navotas and Valenzuela. It brings tenants and
          landlords together, from finding a place to signing the lease and
          paying rent, all in one app.
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row flex-wrap gap-3 mb-6">
        {ABOUT_STATS.map((stat) => (
          <View
            key={stat.label}
            className="bg-surface rounded-xl border border-border px-4 py-3"
            style={{ flexGrow: 1, flexBasis: "45%" }}
          >
            <Text className="text-lg font-nunitoBold text-accent">{stat.value}</Text>
            <Text className="text-xs text-muted">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Mission & Vision */}
      <View className="gap-3 mb-6">
        <PurposeCard
          icon={IconTarget}
          eyebrow="Mission"
          title="What we are here to do"
          body={ABOUT_MISSION}
          iconColor={colors.primary}
        />
        <PurposeCard
          icon={IconEye}
          eyebrow="Vision"
          title="Where we are headed"
          body={ABOUT_VISION}
          iconColor={colors.primary}
        />
      </View>

      <Separator className="my-2" />

      {/* Team */}
      <View className="my-6">
        <Text className="text-xs font-nunitoBold uppercase tracking-widest text-accent mb-1">
          Team
        </Text>
        <Text className="text-lg font-nunitoBold text-foreground">
          The people who built this
        </Text>
        <Text className="text-sm text-muted mt-1 mb-4">Students of STI College Caloocan.</Text>
        <View className="gap-3">
          {TEAM_MEMBERS.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              photo={TEAM_PHOTOS[member.id]}
              onOpenLink={handleLink}
            />
          ))}
        </View>
      </View>

      <Separator className="my-2" />

      {/* Location */}
      <View className="my-6 flex-row items-start gap-3 bg-surface rounded-2xl border border-border p-4">
        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
          <IconMapPin size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-nunitoBold uppercase tracking-widest text-accent mb-1">
            Office
          </Text>
          <Text className="text-sm font-nunitoSemiBold text-foreground">
            {ABOUT_OFFICE_ADDRESS}
          </Text>
          <Text className="text-xs text-muted mt-1 leading-5">{ABOUT_COVERAGE}</Text>
        </View>
      </View>

      {/* Footer */}
      <View className="items-center pb-6">
        <Text className="text-xs text-muted text-center leading-5">
          Developed as a capstone project at
        </Text>
        <Text className="text-xs font-nunitoSemiBold text-muted text-center">
          STI College Caloocan
        </Text>
        <Text className="text-xs text-muted text-center mt-1">
          © {new Date().getFullYear()} APT. All rights reserved.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
