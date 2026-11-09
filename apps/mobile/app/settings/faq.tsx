import { View, Text } from "react-native";

import { Accordion } from "heroui-native";

import { FAQ_ITEMS } from "@/constants/faq";
import { useColors } from "@/hooks/useTheme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

// One collapsible card per question, like the application review screen:
// standard card surface, hairline border, and the answer set off by a divider.
export default function FAQScreen() {
  const { colors } = useColors();

  return (
    <ScreenWrapper
      header={<StandardHeader title="FAQs" />}
      scrollable
      bottomPadding={50}
      className="p-5"
    >
      <Accordion selectionMode="single" hideSeparator className="gap-3">
        {FAQ_ITEMS.map((faq) => (
          <Accordion.Item
            key={faq.id}
            value={faq.id}
            className="bg-surface rounded-2xl border border-border"
          >
            <Accordion.Trigger className="px-4 py-4">
              <Text className="flex-1 text-base font-nunitoSemiBold text-foreground">
                {faq.question}
              </Text>
              <Accordion.Indicator
                iconProps={{ size: 18, color: colors.gray500 }}
              />
            </Accordion.Trigger>
            <Accordion.Content className="px-4 pb-4">
              <View className="border-t border-border pt-3">
                <Text className="text-sm font-inter text-muted leading-5">
                  {faq.answer}
                </Text>
              </View>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    </ScreenWrapper>
  );
}
