import {View, TextInput, TouchableOpacity} from 'react-native'
import { useState } from 'react'

import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconX,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'

interface SearchFieldProps {
  searchPlaceholder?: string,
  onChangeSearch: (text: string) => void,
  searchValue: string,
  isDisabled?: boolean,
  backgroundColor?: string,
  showFilterButton?: boolean,
  onFilterPress?: () => void,
}

export default function SearchField({
  searchPlaceholder = "Search...",
  onChangeSearch,
  searchValue,
  isDisabled = false,
  backgroundColor = COLORS.white,
  showFilterButton = false,
  onFilterPress,
}: SearchFieldProps) {

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleClear = () => {
    onChangeSearch('');
  };

  return (
    <View
      className={`w-full h-16 py-2 px-3 rounded-2xl
        flex-row items-center justify-center gap-2`}
      style={{
        backgroundColor: backgroundColor,
        outlineWidth: isFocused ? 2 : 0,
        outlineColor: COLORS.primary,
      }}
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

        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {searchValue.length > 0 && !isDisabled && (
        <TouchableOpacity
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <IconX
            size={26}
            color={COLORS.grey}
          />
        </TouchableOpacity>
      )}

      {showFilterButton && (
        <TouchableOpacity
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <IconAdjustmentsHorizontal
            size={26}
            color={COLORS.grey}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}