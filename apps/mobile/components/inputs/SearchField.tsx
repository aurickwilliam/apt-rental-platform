import {View, Text, TextInput, TouchableOpacity} from 'react-native'
import { useState } from 'react'

import {
  IconSearch,
  IconAdjustmentsHorizontal,
} from '@tabler/icons-react-native'

import { COLORS } from '../../constants/colors'

interface SearchFieldProps {
  searchPlaceholder?: string,
  onChangeSearch: (text: string) => void,
  searchValue: string,
  isDisabled?: boolean,
}

export default function SearchField({
  searchPlaceholder = "Search...",
  onChangeSearch,
  searchValue,
  isDisabled = false,
}: SearchFieldProps) {

  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <View
      className={`w-full h-16 py-2 px-3 bg-white rounded-2xl
        flex-row items-center justify-center gap-1`}
    >
      <IconSearch
        size={26}
        color={COLORS.grey}
      />

      <TextInput
        value={searchValue}
        numberOfLines={1}
        editable={!isDisabled}
        onChangeText={onChangeSearch}

        style={{
          flex: 1,
          height: '100%',
          paddingVertical: 0,
          color: isDisabled ? COLORS.mediumGrey : COLORS.text,

          fontFamily: 'Inter_24pt-Regular',
          fontSize: 16,
          lineHeight: 20,
        }}
        placeholder={searchPlaceholder}
        placeholderTextColor={COLORS.grey}

        onFocus={() => {
          setIsFocused(true);
        }}
        // When the user taps out of the input field
        onBlur={() => {
          setIsFocused(false);
        }}
      />

      <TouchableOpacity
        onPress={() => console.log('Filter button pressed')}
        activeOpacity={0.7}
      >
        <IconAdjustmentsHorizontal
          size={26}
          color={COLORS.grey}
        />
      </TouchableOpacity>
    </View>
  )
}
