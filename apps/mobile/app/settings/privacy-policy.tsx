import { View, Text } from "react-native";
import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

const sections = [
  {
    id: 1,
    title: "1. Information We Collect",
    content:
      "We collect information you provide when registering, such as your name, email address, phone number, and profile photo. We also collect identity verification documents and payment-related information.",
  },
  {
    id: 2,
    title: "2. How We Use Your Information",
    content:
      "We use your information to provide and improve the APT platform, process payments, verify identities, facilitate communication between tenants and landlords, and send important notifications about your account or rental.",
  },
  {
    id: 3,
    title: "3. Sharing of Information",
    content:
      "We do not sell your personal information to third parties. We may share your information with landlords or tenants as necessary to facilitate a rental transaction, or with service providers who assist us in operating the platform.",
  },
  {
    id: 4,
    title: "4. Data Security",
    content:
      "We take reasonable measures to protect your personal information from unauthorized access, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.",
  },
  {
    id: 5,
    title: "5. Identity Verification",
    content:
      "To ensure the safety of all users, APT requires identity verification through a valid government-issued ID and selfie photo. This information is stored securely and used solely for verification purposes.",
  },
  {
    id: 6,
    title: "6. Cookies and Analytics",
    content:
      "APT may use analytics tools to understand how users interact with the app. This helps us improve the platform experience. No personally identifiable information is shared with analytics providers.",
  },
  {
    id: 7,
    title: "7. Your Rights",
    content:
      "You have the right to access, update, or delete your personal information at any time through your account settings. You may also contact us to request data deletion.",
  },
  {
    id: 8,
    title: "8. Children's Privacy",
    content:
      "APT is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors.",
  },
  {
    id: 9,
    title: "9. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email.",
  },
  {
    id: 10,
    title: "10. Contact Us",
    content:
      "If you have questions or concerns about this Privacy Policy, please reach out to us at support@apt.com.",
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <ScreenWrapper
      header={<StandardHeader title="Privacy Policy" />}
      scrollable
      className="p-5"
    >
      <Text className="text-xs text-default-400 mb-4">
        Last updated: June 2025
      </Text>
      <View className="gap-4 pb-10">
        {sections.map((section, index) => (
          <View key={section.id}>
            <Text className="text-sm font-semibold text-foreground mb-1">
              {section.title}
            </Text>
            <Text className="text-sm text-default-500 leading-6">
              {section.content}
            </Text>
            {index < sections.length - 1 && (
              <View className="h-px bg-divider mt-4" />
            )}
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}
