import { View, Text, Pressable } from 'react-native'

import { Check } from 'lucide-react-native';

import { useColors } from 'hooks/useTheme';

interface PersonalizationRadioButtonProps{
  label: string,
  onPress: () => void,
  selected: boolean,
}

export default function PersonalizationRadioButton({
  label,
  onPress,
  selected = false,
}: PersonalizationRadioButtonProps) {

  const { colors } = useColors();

  return (
    <Pressable
      onPress={onPress}
      className={`w-[48%] rounded-2xl border-2 p-3 mb-4 flex gap-3
        ${selected ? "border-accent bg-surface-tertiary" : "border-field-border bg-surface"}`}
    >
      {/* Circle / Check */}
      <View
        className={`w-10 h-10 rounded-full border-2 items-center justify-center mb-4
          ${selected ? "border-accent" : "border-field-border"}`}
      >
        {selected && (
          <Check
            size={22} 
            color={ colors.primary } 
          />
        )}
      </View>

      {/* Label */}
      <Text className="text-lg font-interMedium text-foreground mt-2">
        {label}
      </Text>
    </Pressable>
  )
}