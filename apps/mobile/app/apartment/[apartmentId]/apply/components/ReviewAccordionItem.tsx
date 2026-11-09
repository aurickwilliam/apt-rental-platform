import { View, Text } from 'react-native'
import { Accordion } from 'heroui-native'

type ReviewAccordionItemProps = {
  value: string
  title: string
  children: React.ReactNode
}

/** One review section, drawn as its own card like the web review step. */
export default function ReviewAccordionItem({
  value,
  title,
  children,
}: ReviewAccordionItemProps) {
  return (
    <Accordion.Item
      value={value}
      className="bg-surface border border-border rounded-2xl"
    >
      <Accordion.Trigger className="px-5 py-4">
        <Text className="text-base font-nunitoSemiBold text-foreground flex-1">
          {title}
        </Text>
        <Accordion.Indicator />
      </Accordion.Trigger>
      <Accordion.Content className="px-5 pb-5">
        <View className="flex gap-3 border-t border-border pt-4">{children}</View>
      </Accordion.Content>
    </Accordion.Item>
  )
}
