import { Pressable, Text } from 'react-native'
import { useRouter } from 'expo-router'

export default function DevBadge() {
  const router = useRouter()

  if (!__DEV__) return null

  return (
    <Pressable
      onPress={() => router.push('/dev/playground')}
      className="absolute bottom-6 right-6 bg-black/80 rounded-full px-3 py-2 flex-row items-center gap-1.5 active:opacity-70"
      style={{ elevation: 8 }}
    >
      <Text className="text-white text-xs font-interSemiBold">
        Dev
      </Text>
    </Pressable>
  )
}
