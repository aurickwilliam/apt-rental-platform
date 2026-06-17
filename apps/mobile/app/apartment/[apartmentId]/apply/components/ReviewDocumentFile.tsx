import { View, Text } from 'react-native'

import { FileText } from 'lucide-react-native'

import { useColors } from '@/hooks/useTheme'

type ReviewDocumentFileProps = {
  label: string
  fileName: string | null | undefined
}
 
export default function ReviewDocumentFile({ label, fileName }: ReviewDocumentFileProps) {
  const { colors } = useColors();
  return (
    <View className="flex gap-2">
      <Text className="text-base text-foreground">{label}</Text>
      <View className="flex-row gap-2 bg-surface border border-border w-full rounded-xl p-4">
        {fileName && <FileText size={20} color={colors.primary} />}

        <Text
          className={`text-sm ${fileName ? "text-foreground" : "text-muted"} font-interMedium`}
          numberOfLines={1}
        >
          {fileName ?? "Not uploaded"}
        </Text>
      </View>
    </View>
  );
}