import { View, Text, Image } from 'react-native'
 
type ReviewDocumentImageProps = {
  label: string
  uri: string | null | undefined
}
 
export default function ReviewDocumentImage({ label, uri }: ReviewDocumentImageProps) {
  return (
    <View className="flex gap-2">
      <Text className="text-base text-foreground">{label}</Text>
      {uri ? (
        <Image
          source={{ uri }}
          className="w-full h-52 rounded-3xl border border-border"
          resizeMode="cover"
        />
      ) : (
        <View className="bg-surface w-full h-52 rounded-lg items-center justify-center">
          <Text className="text-sm text-foreground">Not uploaded</Text>
        </View>
      )}
    </View>
  )
}