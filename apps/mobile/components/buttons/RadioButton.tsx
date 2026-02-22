import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@repo/constants';

interface RadioButtonProps {
 label: string;
 onPress: () => void;
 selected: boolean; 
}

export default function RadioButton({
  label,
  onPress,
  selected = false,
}: RadioButtonProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      className='flex-row gap-2 items-center'
      onPress={onPress}
    >
      <View className={`rounded-full border-2 size-8 items-center justify-center
          ${selected ? "border-primary" : "border-grey-300"}
        `}> 
        {selected && (
          <Ionicons 
            name="ellipse" 
            size={22} 
            color={ COLORS.primary } 
          />
        )}
      </View>

      <Text className="text-text text-base font-inter">
        {label}
      </Text>
    </TouchableOpacity>
  )
}