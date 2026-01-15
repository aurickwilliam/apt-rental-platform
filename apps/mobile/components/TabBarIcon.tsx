import { PlatformPressable } from '@react-navigation/elements'
import { View, Text } from "react-native"
import { JSX } from 'react';

interface TabBarIconProps {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  color: string;
  label: string;
  icon: Record<string, (props: any) => JSX.Element>
}

export default function TabBarIcon({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
  icon
}: TabBarIconProps) {

  return (
    <PlatformPressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`flex-1 justify-center items-center rounded-full gap-[2px] m-2`}
    >
      <View>
        {
          icon[routeName]({
            color: color,
            size: 26,
            isFocused
          })
        }
      </View>

      <Text style={{ color: color, fontSize: 12 }}>
        {label}
      </Text>
    </PlatformPressable>
  )
}
