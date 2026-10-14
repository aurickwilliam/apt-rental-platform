import { View, Text, type LayoutChangeEvent } from 'react-native'
import { Image } from 'expo-image'
import { PressableFeedback } from 'heroui-native'
import { IconBuilding, IconChevronRight } from '@tabler/icons-react-native'
import { formatPesoDisplay } from '@repo/utils'

import { useColors } from '@/hooks/useTheme'

import type { ChatApartmentSummary } from '@/service/chat/chatApartmentService'

interface ChatApartmentCardProps {
  apartment: ChatApartmentSummary
  onPress: () => void
  onLayout?: (event: LayoutChangeEvent) => void
}

/**
 * The apartment an inquiry chat is about: a full-width strip under the chat
 * header (rounded photo, bottom border) that the messages
 * scroll beneath. Tapping opens the apartment.
 */
export default function ChatApartmentCard({ apartment, onPress, onLayout }: ChatApartmentCardProps) {
  const { colors } = useColors()
  const rent = formatPesoDisplay(apartment.monthlyRent)

  return (
    <View onLayout={onLayout}>
      <PressableFeedback
        onPress={onPress}
        className="border-b border-border bg-background"
        accessibilityRole="button"
        accessibilityLabel={`${apartment.name}${apartment.location ? `, ${apartment.location}` : ''}${rent ? `, ${rent} a month` : ''}`}
        accessibilityHint="Opens the apartment"
      >
        <PressableFeedback.Highlight />
        <View className="flex-row items-center gap-3 px-4 py-2.5">
          <View className="size-14 items-center justify-center overflow-hidden rounded-xl bg-surface-tertiary">
            {apartment.thumbnailUrl ? (
              <Image
                source={{ uri: apartment.thumbnailUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="disk"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <IconBuilding size={22} color={colors.gray500} />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-sm text-foreground font-nunitoSemiBold" numberOfLines={1}>
              {apartment.name}
            </Text>
            {apartment.location ? (
              <Text className="text-xs text-gray-500 font-inter" numberOfLines={1}>
                {apartment.location}
              </Text>
            ) : null}
            {rent ? (
              <Text className="text-xs text-foreground font-inter" numberOfLines={1}>
                <Text className="font-nunitoBold text-primary">{rent}</Text> / month
              </Text>
            ) : null}
          </View>

          <IconChevronRight size={18} color={colors.gray500} />
        </View>
      </PressableFeedback>
    </View>
  )
}
