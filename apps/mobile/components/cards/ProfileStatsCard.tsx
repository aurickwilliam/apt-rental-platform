import { Fragment } from 'react'
import { View } from 'react-native'
import { Text } from 'heroui-native'
import type React from 'react'

import { useColors } from 'hooks/useTheme'

export type ProfileStat = {
  label: string
  value?: string
  variant?: 'default' | 'icon'
  iconSize?: number
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  iconColor?: string
  valueColor?: string
  valueClassName?: string
}

interface ProfileStatsCardProps {
  stats: ProfileStat[]
}

export default function ProfileStatsCard({ stats }: ProfileStatsCardProps) {
  const { colors } = useColors();

  return (
    <View className="bg-surface rounded-3xl border border-border shadow-none px-2 py-5 flex-row items-center">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Fragment key={stat.label}>
            {index > 0 && <View className="w-px self-stretch bg-border mx-1" />}

            <View className="flex-1 items-center gap-1">
              {stat.variant === 'icon' ? (
                <>
                  {Icon && (
                    <Icon
                      size={stat.iconSize ?? 28}
                      color={stat.iconColor ?? colors.textPrimary}
                      strokeWidth={2.5}
                    />
                  )}

                  <Text className="text-sm text-muted text-center font-nunitoSemiBold leading-tight">
                    {stat.label}
                  </Text>
                </>
              ) : (
                <>
                  <Text className={`text-2xl font-nunitoBold ${stat.valueColor ?? 'text-foreground'} ${stat.valueClassName ?? ''}`}>
                    {stat.value}
                  </Text>

                  <View className="flex-row items-center gap-1">
                    {Icon && (
                      <Icon
                        size={16}
                        color={stat.iconColor ?? colors.textPrimary}
                        strokeWidth={2.5}
                      />
                    )}

                    <Text className="text-sm text-muted text-center font-nunitoSemiBold leading-tight">
                      {stat.label}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}