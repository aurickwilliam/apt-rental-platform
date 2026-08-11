import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { IconChevronRight } from '@tabler/icons-react-native'

interface LinkRowProps {
  label: string
  route: string
}

function LinkRow({ label, route }: LinkRowProps) {
  const router = useRouter()
  return (
    <Pressable
      onPress={() => router.push(route as any)}
      className="flex-row items-center justify-between py-3 px-4 border-b border-gray-100 active:bg-gray-50"
    >
      <View className="flex-1">
        <Text className="text-base font-interMedium text-foreground">{label}</Text>
        <Text className="text-xs font-inter text-muted mt-0.5">{route}</Text>
      </View>
      <IconChevronRight size={18} color="#9CA3AF" />
    </Pressable>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-2">
      <Text className="text-xs font-interSemiBold text-muted uppercase tracking-wider px-4 py-2 bg-gray-50">
        {title}
      </Text>
      {children}
    </View>
  )
}

export default function DevNavScreen() {
  return (
    <ScrollView className="flex-1 bg-white pt-16">
      <Text className="text-xl font-interSemiBold text-foreground px-4 pb-4">Dev Navigation</Text>

      <Section title="Auth">
        <LinkRow label="Sign In" route="/sign-in" />
        <LinkRow label="Sign Up" route="/sign-up" />
        <LinkRow label="Onboarding" route="/onboarding" />
        <LinkRow label="Verify Mobile" route="/verify-mobile" />
        <LinkRow label="OTP Verification" route="/otp-verification" />
        <LinkRow label="Complete Profile" route="/complete-profile" />
        <LinkRow label="Forgot Password" route="/forgot-password" />
      </Section>

      <Section title="Tenant Tabs">
        <LinkRow label="Search" route="/(tabs)/(tenant)/search" />
        <LinkRow label="Rentals" route="/(tabs)/(tenant)/rentals" />
        <LinkRow label="Chat" route="/(tabs)/(tenant)/chat" />
        <LinkRow label="Profile" route="/(tabs)/(tenant)/profile" />
      </Section>

      <Section title="Landlord Tabs">
        <LinkRow label="Dashboard" route="/(tabs)/(landlord)/dashboard" />
        <LinkRow label="Units" route="/(tabs)/(landlord)/units" />
        <LinkRow label="Chat" route="/(tabs)/(landlord)/chat" />
        <LinkRow label="Profile" route="/(tabs)/(landlord)/profile" />
      </Section>

      <Section title="Tenant Screens">
        <LinkRow label="Favorites" route="/tenant/favorites" />
        <LinkRow label="Current Apartment" route="/tenant/current-apartment" />
        <LinkRow label="Applications" route="/tenant/applications" />
        <LinkRow label="Payment" route="/tenant/payment" />
        <LinkRow label="Payment Success" route="/tenant/payment/success" />
        <LinkRow label="Payment E-Wallet Redirect" route="/tenant/payment/e-wallet-redirect" />
        <LinkRow label="Payment History" route="/tenant/payment/history" />
        <LinkRow label="Payment Methods" route="/tenant/payment/saved-methods" />
        <LinkRow label="Add Payment Method" route="/tenant/payment/saved-methods/add" />
        <LinkRow label="Saved Methods — Card Form" route="/tenant/payment/saved-methods/card-form" />
        <LinkRow label="Saved Methods — E-Wallet Redirect" route="/tenant/payment/saved-methods/e-wallet-redirect" />
        <LinkRow label="Request Maintenance" route="/tenant/request-maintenance" />
        <LinkRow label="Maintenance History" route="/tenant/maintenance-history" />
      </Section>

      <Section title="Landlord Screens">
        <LinkRow label="Analytics" route="/landlord/analytics" />
        <LinkRow label="Maintenance Requests" route="/landlord/maintenance-requests" />
        <LinkRow label="Tenant Applications" route="/landlord/tenant-applications" />
        <LinkRow label="Visit Requests" route="/landlord/visit-requests" />
        <LinkRow label="Add Apartment" route="/landlord/manage-apartment/add-apartment" />
        <LinkRow label="Manage Apartment (mock)" route="/landlord/manage-apartment/mock-apt-1" />
      </Section>

      <Section title="Apartment">
        <LinkRow label="Apartment Detail (mock)" route="/apartment/mock-apt-1" />
        <LinkRow label="Ratings (mock)" route="/apartment/mock-apt-1/ratings" />
        <LinkRow label="Map View (mock)" route="/apartment/mock-apt-1/map-view" />
        <LinkRow label="Included Perks (mock)" route="/apartment/mock-apt-1/included-perks" />
        <LinkRow label="Rate Apartment (mock)" route="/apartment/mock-apt-1/rate-apartment" />
        <LinkRow label="Apply — Summary (mock)" route="/apartment/mock-apt-1/apply/apartment-summary" />
        <LinkRow label="Apply — Review (mock)" route="/apartment/mock-apt-1/apply/review-information" />
        <LinkRow label="Apply — Submitted (mock)" route="/apartment/mock-apt-1/apply/submitted" />
      </Section>

      <Section title="Settings">
        <LinkRow label="Settings" route="/settings" />
        <LinkRow label="About" route="/settings/about" />
        <LinkRow label="FAQ" route="/settings/faq" />
        <LinkRow label="Privacy Policy" route="/settings/privacy-policy" />
        <LinkRow label="Terms" route="/settings/terms" />
      </Section>

      <Section title="Profile & Documents">
        <LinkRow label="Edit Profile" route="/edit-profile" />
        <LinkRow label="Document ID" route="/document-id" />
        <LinkRow label="Document Upload" route="/document-id/upload" />
      </Section>

      <Section title="Notifications">
        <LinkRow label="Landlord Notifications" route="/landlord-notif" />
        <LinkRow label="Tenant Notifications" route="/tenant-notif" />
      </Section>

      <Section title="Chat">
        <LinkRow label="Conversation (mock)" route="/chat/mock-convo-1" />
      </Section>

      <Section title="Profile (Dynamic)">
        <LinkRow label="Landlord Profile (mock)" route="/profile/landlord/mock-ll-1" />
        <LinkRow label="Tenant Profile (mock)" route="/profile/tenant/mock-tnt-1" />
      </Section>

      <Section title="AI">
        <LinkRow label="AI Search" route="/search/ai-search" />
      </Section>

      <Section title="Dev">
        <LinkRow label="Giphy" route="/dev/giphy" />
      </Section>

      <View className="h-12" />
    </ScrollView>
  )
}
