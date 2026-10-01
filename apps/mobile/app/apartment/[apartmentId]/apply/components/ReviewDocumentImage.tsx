import { View, Text } from 'react-native'
import { Image } from 'expo-image';

import { useColors } from '@/hooks/useTheme'

type ReviewDocumentImageProps = {
  label: string
  uri: string | null | undefined
  passportName?: string | null
}

export default function ReviewDocumentImage({ label, uri, passportName }: ReviewDocumentImageProps) {
  const { colors } = useColors();

  return (
    <View className="flex gap-2">
      <Text className="text-base text-foreground">{label}</Text>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: "100%",
            height: 208,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}
          contentFit="cover"
          cachePolicy="disk"
        />
      ) : passportName ? (
        <View className="bg-surface w-full rounded-xl border border-border items-center justify-center p-4">
          <Text className="text-sm text-foreground font-nunitoSemiBold" numberOfLines={1}>
            From passport · {passportName}
          </Text>
        </View>
      ) : (
        <View className="bg-surface w-full h-52 rounded-lg items-center justify-center">
          <Text className="text-sm text-foreground">Not uploaded</Text>
        </View>
      )}
    </View>
  )
}
