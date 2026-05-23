import { Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const DEV_ROUTES = [
  { label: 'OTP Verification', href: '/(auth)/forgot-password/otp-verification' },
  { label: 'Reset Password', href: '/(auth)/forgot-password/reset-password' },
  { label: 'Tenant Dashboard', href: '/(tenant)/home' },
  // add more as needed
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