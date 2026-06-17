import { View, Text } from 'react-native'

type ReviewFieldProps = {
  label: string
  value: React.ReactNode
}

export default function ReviewField({ label, value }: ReviewFieldProps) {
  return (
    <View className="flex">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-base text-foreground font-interMedium">
        {value}
      </Text>
    </View>
  )
}