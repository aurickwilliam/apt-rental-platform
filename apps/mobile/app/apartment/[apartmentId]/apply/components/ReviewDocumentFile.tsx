import { View, Text } from 'react-native'

import { IconFileText } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

type ReviewDocumentFileProps = {
  label: string
  fileName: string | null | undefined
  passportName?: string | null
}

export default function ReviewDocumentFile({ label, fileName, passportName }: ReviewDocumentFileProps) {
  const { colors } = useColors();
  const displayName = fileName ?? (passportName ? `From passport · ${passportName}` : null);
  return (
    <View className="flex gap-2">
      <Text className="text-base text-foreground">{label}</Text>
      <View className="flex-row gap-2 bg-surface border border-border w-full rounded-xl p-4">
        {displayName && <IconFileText size={20} color={colors.primary} />}

        <Text
          className={`text-sm ${displayName ? "text-foreground" : "text-muted"} font-nunitoSemiBold`}
          numberOfLines={1}
        >
          {displayName ?? "Not uploaded"}
        </Text>
      </View>
    </View>
  );
}