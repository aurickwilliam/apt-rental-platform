import { View, Text } from 'react-native'
import { Image } from 'expo-image'

import { Card, PressableFeedback } from 'heroui-native'

import { useColors } from '@/hooks/useTheme'

interface PropertyCardProps {
  apartmentName: string
  barangay: string
  city: string
  status: 'Available' | 'Occupied' | 'Under Maintenance' | 'Unverified' | 'Verified'
  thumbnailUrl: string | undefined
  onPress: () => void
}

export default function PropertyCard({
  apartmentName,
  barangay,
  city,
  status,
  thumbnailUrl,
  onPress,
}: PropertyCardProps) {
  const { colors } = useColors();

  const STATUS_STYLES = {
    'Occupied': {
      backgroundColor: colors.successLight,
      color: colors.success,
    },
    'Under Maintenance': {
      backgroundColor: colors.warningLight,
      color: colors.warning,
    },
    'Available': {
      backgroundColor: colors.primaryLight,
      color: colors.primary,
    },
    'Unverified': {
      backgroundColor: colors.gray200,
      color: colors.gray500,
    },
    'Verified': {
      backgroundColor: colors.successLight,
      color: colors.success,
    }
  }

  return (
    <PressableFeedback onPress={onPress}>
      <PressableFeedback.Highlight />
      <Card
        className='flex-row overflow-hidden rounded-3xl border border-border p-0 shadow-none'
      >
        {/* Image — fills full height, left corners rounded to match card */}
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

        {/* Content */}
        <Card.Body className='px-3 py-2 min-w-0 justify-between flex-1'>
          <View>
            <Card.Title
              className='text-base font-interMedium text-foreground leading-snug'
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {apartmentName}
            </Card.Title>

            <Card.Description
              className='text-muted text-sm font-inter'
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {barangay}, {city}
            </Card.Description>
          </View>

          <View
            className='px-2 py-1 rounded-full self-start border'
            style={{
              backgroundColor: STATUS_STYLES[status].backgroundColor,
              borderColor: STATUS_STYLES[status].color,
            }}
          >
            <Text
              className='text-xs font-inter'
              style={{ color: STATUS_STYLES[status].color }}
            >
              {status}
            </Text>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}
