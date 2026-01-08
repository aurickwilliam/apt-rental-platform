import { Ionicons } from '@expo/vector-icons'
import { View, Text, Pressable } from 'react-native'

import { COLORS } from '@/constants/colors'

interface BedroomRadioButtonProps{
  bedRoomLabel: string,
  onPress: () => void,
  selected: boolean,
}

export default function BedroomRadioButton({
  bedRoomLabel,
  onPress,
  selected = false,
}: BedroomRadioButtonProps) {


  
  return (
    <Pressable
      onPress={onPress}
      className={`w-[48%] rounded-2xl border-2 p-5 mb-4
        ${selected ? "border-primary bg-lightBlue" : "border-grey-300 bg-white"}`}
    >
      {/* Circle / Check */}
      <View
        className={`w-10 h-10 rounded-full border-2 items-center justify-center mb-4
          ${selected ? "border-primary" : "border-grey-300"}`}
      >
        {selected && (
          <Ionicons 
            name="ellipse" 
            size={22} 
            color={ COLORS.primary } 
          />
        )}
      </View>

      {/* Label */}
      <Text className="text-xl font-interMedium text-text">
        {bedRoomLabel}
      </Text>
    </Pressable>
  )
}