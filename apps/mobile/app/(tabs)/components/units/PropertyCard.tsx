import { View, Text } from 'react-native'
import { Image } from 'expo-image'

import { Card, PressableFeedback } from 'heroui-native'

import { IconShieldCheck } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

import { ApartmentStatus, APARTMENT_STATUS_LABELS } from '@repo/constants'

import { formatPesoDisplay } from '@repo/utils'

interface PropertyCardProps {
  apartmentName: string
  barangay: string
  city: string
  status: ApartmentStatus
  isVerified: boolean
  thumbnailUrl: string | undefined
  onPress: () => void
  monthlyRent?: number
}

export default function PropertyCard({
  apartmentName,
  barangay,
  city,
  status,
  isVerified,
  thumbnailUrl,
  onPress,
  monthlyRent,
}: PropertyCardProps) {
  const { colors } = useColors();

  const STATUS_STYLES: Record<ApartmentStatus, { backgroundColor: string; color: string }> = {
    available: {
      backgroundColor: colors.primaryLight,
      color: colors.primary,
    },
    occupied: {
      backgroundColor: colors.successLight,
      color: colors.success,
    },
    under_maintenance: {
      backgroundColor: colors.warningLight,
      color: colors.warning,
    },
    unverified: {
      backgroundColor: colors.gray200,
      color: colors.gray500,
    },
  }

  const style = STATUS_STYLES[status] ?? {
    backgroundColor: colors.gray200,
    color: colors.gray500,
  }

  return (
    <PressableFeedback onPress={onPress} className='rounded-3xl overflow-hidden'>
      <PressableFeedback.Highlight />
      <Card className='flex-row h-28 overflow-hidden rounded-3xl border border-border p-0 shadow-none'>
        <Image
          source={{ uri: thumbnailUrl }}
          className='w-30 shrink-0'
          style={{
            aspectRatio: 1,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }}
          contentFit='cover'
          cachePolicy="disk"
        />
        <Card.Body className='px-3 py-2 min-w-0 justify-between flex-1'>
          <View>
            <View className="flex-row items-center">
              <Card.Title
                className="flex-1 mr-2 text-base font-interMedium text-foreground leading-snug"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {apartmentName}
              </Card.Title>

              {isVerified && (
                <IconShieldCheck
                  size={18}
                  color={colors.success}
                />
              )}
            </View>
            <Card.Description
              className='text-muted text-sm font-inter'
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {barangay}, {city}
            </Card.Description>
          </View>

          <View className='flex-row items-center justify-between'>
            {/* Monthly Rent */}
            <Text className='text-sm font-interMedium text-accent'>
              {monthlyRent ? formatPesoDisplay(monthlyRent) : 'N/A'}
            </Text>
            {/* Status chip */}
            <View
              className='px-2 py-1 rounded-full self-start border'
              style={{
                backgroundColor: style.backgroundColor,
                borderColor: style.color,
              }}
            >
              <Text className='text-xs font-inter' style={{ color: style.color }}>
                {APARTMENT_STATUS_LABELS[status]}
              </Text>
            </View>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}
