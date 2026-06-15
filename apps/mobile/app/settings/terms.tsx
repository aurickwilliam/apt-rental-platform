import { View, Text } from "react-native";
import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

const sections = [
  {
    id: 1,
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using APT (A Place to Thrive), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.",
  },
  {
    id: 2,
    title: "2. Use of the App",
    content:
      "APT is a rental platform connecting tenants and landlords. You agree to use the app only for lawful purposes and in a manner that does not infringe the rights of others or restrict their use of the platform.",
  },
  {
    id: 3,
    title: "3. Account Registration",
    content:
      "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
  },
  {
    id: 4,
    title: "4. Rental Listings",
    content:
      "Landlords are responsible for the accuracy of their property listings. APT does not guarantee the accuracy of any listing and is not liable for any misrepresentations made by landlords or tenants.",
  },
  {
    id: 5,
    title: "5. Payments",
    content:
      "All payments made through APT are processed securely. APT is not responsible for any payment disputes between tenants and landlords. Rental duration is a minimum of 3 months and a maximum of 12 months.",
  },
  {
    id: 6,
    title: "6. Prohibited Conduct",
    content:
      "You may not use APT to engage in fraudulent activity, post false listings, harass other users, or violate any applicable laws or regulations.",
  },
  {
    id: 7,
    title: "7. Termination",
    content:
      "APT reserves the right to suspend or terminate your account at any time if you are found to be in violation of these Terms and Conditions.",
  },
  {
    id: 8,
    title: "8. Changes to Terms",
    content:
      "APT may update these Terms and Conditions from time to time. Continued use of the app after changes are posted constitutes your acceptance of the revised terms.",
  },
  {
    id: 9,
    title: "9. Contact Us",
    content:
      "If you have any questions about these Terms and Conditions, please contact us at support@apt.com.",
  },
];

export default function TermsScreen() {
  return (
    <ScreenWrapper
      header={<StandardHeader title="Terms and Conditions" />}
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