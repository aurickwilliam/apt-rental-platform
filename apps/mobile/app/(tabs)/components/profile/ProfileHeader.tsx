import { View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type React from 'react';

import { Avatar, Chip, Text } from 'heroui-native';

import {
  IconHome,
  IconBuildingSkyscraper,
  IconShieldCheck,
} from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';

type ProfileHeaderProps = {
  backgroundPhotoUri?: string | null
  avatarUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarInitials?: string
  loading?: boolean
  role?: string | null
  accountStatus?: string | null
}

export default function ProfileHeader({
  backgroundPhotoUri,
  avatarUrl,
  firstName,
  lastName,
  email,
  avatarInitials,
  loading = false,
  role,
  accountStatus,
}: ProfileHeaderProps) {
  const { colors } = useColors();
  const insets = useSafeAreaInsets();

  const isVerified = accountStatus === 'verified';

  const fullName = loading ? '...' : `${firstName} ${lastName}`;
  const displayEmail = loading ? '...' : email;

  type RoleConfig = {
    [key: string]: {
      icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
      iconColor: string;
      className: string;
      label: string;
      labelColor: string;
    }
  };

  const roleConfig: RoleConfig = {
    tenant: {
      icon: IconHome,
      iconColor: colors.primary,
      className: "bg-primary-light border border-primary",
      label: "Tenant",
      labelColor: "text-primary"
    },
    landlord: {
      icon: IconBuildingSkyscraper,
      iconColor: colors.secondary,
      className: "bg-secondary-light border border-secondary",
      label: "Landlord",
      labelColor: "text-secondary"
    },
  };

  return (
    <View className="relative">
      {/* Background Photo */}
      <View
        style={{ marginTop: -insets.top, height: 180 + insets.top }}
        className={`w-full rounded-b-3xl overflow-hidden ${
          backgroundPhotoUri ? "bg-transparent" : "bg-surface-tertiary"
        }`}
      >
        {backgroundPhotoUri && (
          <Image
            source={{ uri: backgroundPhotoUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="disk"
          />
        )}
      </View>

      {/* Profile Picture */}
      <View className="absolute top-18 left-0 right-0 items-center">
        <Avatar
          size="lg"
          color="accent"
          className="size-36 border-4 border-background mb-1"
          alt={fullName}
        >
          {avatarUrl && <Avatar.Image source={{ uri: avatarUrl }} />}

          <Avatar.Fallback
            delayMs={200}
            className="justify-center items-center"
          >
            <Text className="text-accent text-4xl font-interMedium leading-none mt-3">
              {/* mt-3 compensates for font-interMedium's vertical metrics
              so the initials sit centered in the circle */}
              {avatarInitials ?? ""}
            </Text>
          </Avatar.Fallback>
        </Avatar>
      </View>

      {/* Name and Email */}
      <View className="items-center pt-12">
        <View className="flex items-center justify-center">
          <Text className="text-foreground text-xl font-interSemiBold">
            {fullName}
          </Text>

          <Text className="text-gray-500 text-base font-inter">
            {displayEmail}
          </Text>

          {(role || isVerified) && (
            <View className="flex-row items-center gap-2 mt-2">
              {role &&
                (() => {
                  const {
                    icon: Icon,
                    iconColor,
                    className,
                    label,
                    labelColor,
                  } = roleConfig[role];

                  return (
                    <Chip className={className} variant="soft">
                      <Icon size={18} color={iconColor} strokeWidth={2.5} />
                      <Chip.Label className={`font-interMedium ${labelColor}`}>
                        {label}
                      </Chip.Label>
                    </Chip>
                  );
                })()}

              {isVerified && (
                <Chip
                  className="bg-success-light border border-success"
                  variant="soft"
                >
                  <IconShieldCheck
                    size={18}
                    color={colors.success}
                    strokeWidth={2.5}
                  />
                  <Chip.Label className="font-interMedium text-success">
                    Verified
                  </Chip.Label>
                </Chip>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
