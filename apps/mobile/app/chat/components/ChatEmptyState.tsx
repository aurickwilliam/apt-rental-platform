import { View, Text } from 'react-native'
import { Avatar, Button } from 'heroui-native'
import { IconBuilding, IconRosetteDiscountCheckFilled, IconShieldCheck, IconUser } from '@tabler/icons-react-native'
import { getInitials } from '@repo/utils'

import { useColors } from '@/hooks/useTheme'

interface ChatEmptyStateProps {
  otherUserName?: string
  otherUserAvatar?: string
  apartmentTitle?: string
  /** "Landlord" / "Tenant", shown before the apartment; omitted when unknown. */
  otherPartyLabel?: string
  isVerified?: boolean
  hasMessages?: boolean
  onViewProfile?: () => void
  onViewApartment?: () => void
}

/**
 * Intro card at the start of a conversation: who the other person is, quick
 * links to their profile and the apartment, and a payment-safety reminder.
 */
export default function ChatEmptyState({
  otherUserName,
  otherUserAvatar,
  apartmentTitle,
  otherPartyLabel,
  isVerified = false,
  hasMessages,
  onViewProfile,
  onViewApartment,
}: ChatEmptyStateProps) {
  const { colors } = useColors()

  const contextLine = [otherPartyLabel, apartmentTitle].filter(Boolean).join(' · ')
  const hasActions = Boolean(onViewProfile || onViewApartment)

  return (
    <View className="items-center px-6 pt-2 pb-6">
      <Avatar
        size="lg"
        color="accent"
        className="size-24 border-2 border-border mb-3 rounded-full overflow-hidden"
        alt={otherUserName}
      >
        {otherUserAvatar ? (
          <Avatar.Image source={{ uri: otherUserAvatar }} />
        ) : null}
        <Avatar.Fallback delayMs={200} className="justify-center items-center rounded-full">
          <Text className="text-accent text-3xl font-nunitoSemiBold leading-none">
            {otherUserName ? getInitials(otherUserName) : '?'}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      {otherUserName && (
        <View className="flex-row items-center gap-1 mb-0.5">
          <Text className="text-foreground text-xl font-nunitoBold">{otherUserName}</Text>
          {isVerified && (
            <IconRosetteDiscountCheckFilled
              size={20}
              color={colors.primary}
              accessibilityLabel="Verified account"
            />
          )}
        </View>
      )}

      {contextLine ? (
        <Text className="text-center text-sm font-inter text-gray-500">{contextLine}</Text>
      ) : null}

      {hasActions && (
        <View className="flex-row gap-2 mt-4">
          {onViewProfile && (
            <Button size="sm" variant="tertiary" onPress={onViewProfile} className="rounded-full">
              <IconUser size={16} color={colors.textPrimary} />
              <Button.Label className="font-inter">View profile</Button.Label>
            </Button>
          )}
          {onViewApartment && (
            <Button size="sm" variant="tertiary" onPress={onViewApartment} className="rounded-full">
              <IconBuilding size={16} color={colors.textPrimary} />
              <Button.Label className="font-inter">View apartment</Button.Label>
            </Button>
          )}
        </View>
      )}

      {!hasMessages && (
        <Text className="text-center text-[13px] font-inter text-gray-500 leading-5 mt-4">
          No messages yet{otherUserName ? ` — send a message to start chatting.` : '.'}
        </Text>
      )}

      <View className="flex-row items-center justify-center gap-1.5 mt-4 px-4">
        <IconShieldCheck size={14} color={colors.gray500} />
        <Text className="shrink text-center text-xs font-inter text-gray-500 leading-[18px]">
          Keep payments inside APT, never through chat.
        </Text>
      </View>
    </View>
  )
}
