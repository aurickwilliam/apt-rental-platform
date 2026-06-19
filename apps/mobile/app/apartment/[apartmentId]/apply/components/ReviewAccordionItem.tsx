import { View, Text } from 'react-native'
import { Accordion } from 'heroui-native'

type ReviewAccordionItemProps = {
  value: string
  title: string
  children: React.ReactNode
}

export default function ReviewAccordionItem({
  value,
  title,
  children,
}: ReviewAccordionItemProps) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Trigger>
        <Text className="text-base font-interMedium text-foreground flex-1">
          {title}
        </Text>
        <Accordion.Indicator />
      </Accordion.Trigger>
      <Accordion.Content>
        <View className="flex gap-3">{children}</View>
      </Accordion.Content>
    </Accordion.Item>
  )
}