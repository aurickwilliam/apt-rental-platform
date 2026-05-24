import { Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const DEV_ROUTES = [
  { label: 'Complete Profile', href: '/(auth)/complete-profile' },
  { label: 'Reset Password', href: '/(auth)/forgot-password/reset-password' },
  { label: 'Updated', href: '/(auth)/forgot-password/updated' },
];

export default function DevLauncher() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 p-5 pt-16 bg-white">
      <Text className="text-xl font-interSemiBold mb-4">🛠 Dev Launcher</Text>
      {DEV_ROUTES.map(({ label, href }) => (
        <Pressable
          key={href}
          onPress={() => router.push(href as any)}
          className="mb-3 p-4 bg-gray-100 rounded-xl"
        >
          <Text className="text-base font-inter">{label}</Text>
          <Text className="text-xs text-gray-400 mt-1">{href}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}