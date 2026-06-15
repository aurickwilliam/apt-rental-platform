import { View, Text } from "react-native";

import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

const faqs = [
  {
    id: 1,
    question: "How do I pay my rent?",
    answer:
      "You can pay your rent through the app by going to Rentals > Pay Rent and selecting your preferred payment method (GCash, Maya, or card).",
  },
  {
    id: 2,
    question: "How do I submit a maintenance request?",
    answer:
      "Go to your Rentals tab and tap 'Request Maintenance'. Fill in the details of the issue and submit. Your landlord will be notified.",
  },
  {
    id: 3,
    question: "How do I view my lease agreement?",
    answer:
      "Go to your Rentals tab and tap 'View Lease'. You can view and download your lease agreement from there.",
  },
  {
    id: 4,
    question: "How do I contact my landlord?",
    answer:
      "You can message your landlord directly through the Chat tab or by tapping 'Chat Landlord' in your Rentals quick actions.",
  },
  {
    id: 5,
    question: "How do I list my property?",
    answer:
      "As a landlord, go to the Units tab and tap the '+' button to add a new apartment listing. Fill in the required details across the steps.",
  },
  {
    id: 6,
    question: "How do I verify my account?",
    answer:
      "Go to your Profile tab and tap on 'Verify Account'. You will need to upload a valid government-issued ID and a selfie.",
  },
];

export default function FAQScreen() {
  return (
    <ScreenWrapper
      header={<StandardHeader title="Frequently Asked Questions" />}
      scrollable
      className="px-5"
    >
      {faqs.map((faq, index) => (
        <View
          key={faq.id}
          className={`mb-3 rounded-xl bg-default-100 p-4 ${index === faqs.length - 1 ? "mb-8" : ""}`}
        >
          <Text className="mb-2 font-semibold text-foreground text-base">
            {faq.question}
          </Text>
          <Text className="text-muted text-sm leading-5">
            {faq.answer}
          </Text>
        </View>
      ))}
    </ScreenWrapper>
  );
}