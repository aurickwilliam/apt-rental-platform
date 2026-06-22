import { View, Text } from 'react-native'

interface DetailFieldProps {
  label: string;
  value: string | number | null | undefined;
}

export default function DetailField({ label, value }: DetailFieldProps) {
  return (
    <View className="flex-1">
      <Text className="text-sm text-muted font-inter">
        {label}
      </Text>
      <Text className="text-base font-interMedium text-foreground">
        {value ?? 'N/A'}
      </Text>
    </View>
  )
}