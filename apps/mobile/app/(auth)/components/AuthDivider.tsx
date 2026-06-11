import { View, Text } from 'react-native'

import { Separator } from 'heroui-native'

type AuthDividerProps = {
  middleText: string;
}

export default function AuthDivider({ middleText }: AuthDividerProps) {
  return (
    <View className="flex-row justify-center items-center my-5">
      <Separator orientation="horizontal" className="flex-1" />

      <Text className="mx-3 text-gray-400 font-inter">
        {middleText}
      </Text>

      <Separator orientation="horizontal" className="flex-1" />
    </View>
  )
}