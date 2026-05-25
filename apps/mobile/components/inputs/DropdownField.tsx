import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';

import { BottomSheet, Input, useBottomSheetAwareHandlers } from 'heroui-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import {
  ChevronDown,
  ChevronUp,
} from "lucide-react-native"

import { COLORS } from '@repo/constants';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

function SearchInput({ value, onChangeText, placeholder }: SearchInputProps) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      onBlur={onBlur}
      className="mb-2"
    />
  );
}

interface DropdownFieldProps {
  label: string;
  bottomSheetLabel: string;
  options: string[];
  value?: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
}

export default function DropdownField({
  label,
  bottomSheetLabel,
  options,
  value,
  onSelect,
  placeholder = 'Select a value',
  required = false,
  error,
  enableSearch = false,
  searchPlaceholder = 'Search...',
}: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return options;
    return options.filter((o) =>
      o.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, enableSearch]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setSearchQuery('');
  };

  return (
    <View className="w-full flex-col gap-2">

      <Text className={`text-base font-interMedium ${error ? 'text-redHead-200' : 'text-text'}`}>
        {label} {required && <Text className="text-redHead-200">*</Text>}
      </Text>

      <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>

        <BottomSheet.Trigger asChild>
          <Pressable
            style={{ alignItems: 'center' }} 
            className={`bg-white border-2 rounded-2xl pl-3 pr-4 h-12 flex-row items-center
              justify-between shadow-xs ${
                error
                  ? 'border-redHead-200'
                  : isOpen
                  ? 'border-primary'
                  : 'border-gray-200'
              }`}
          >
            <Text className={`font-inter ${value ? 'text-text' : 'text-gray-500'}`}>
              {value || placeholder}
            </Text>

            {/* <Ionicons
              name={isOpen ? 'caret-up' : 'caret-down'}
              size={24}
              color={COLORS.text}
            /> */}
            {isOpen ? (
              <ChevronUp size={24} color={COLORS.text} />
            ) : (
              <ChevronDown size={24} color={COLORS.text} />
            )}
          </Pressable>
        </BottomSheet.Trigger>

        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={['50%', '75%']}
            enableOverDrag={false}
            enableDynamicSizing={false}
            contentContainerClassName="h-full"
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            backgroundClassName="bg-white"
            handleIndicatorClassName="bg-gray-300 w-10"
          >
            <BottomSheetFlatList
              data={filteredOptions}
              keyExtractor={(item: string) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }: { item: string }) => (
                <Pressable
                  className="p-4 rounded-lg border-b border-grey-100"
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text className="text-base text-text text-left font-inter">{item}</Text>
                </Pressable>
              )}
              ListHeaderComponent={
                <View>
                  <Text className="text-base text-center text-text font-interMedium border-b border-grey-200 pb-3 mb-4">
                    {bottomSheetLabel}
                  </Text>
                  {enableSearch && (
                    <SearchInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={searchPlaceholder}
                    />
                  )}
                </View>
              }
              ListEmptyComponent={
                <View className="py-8 items-center justify-center">
                  <Text className="text-lg text-gray-500 font-inter">
                    {searchQuery.trim() ? 'No results found' : 'No options available'}
                  </Text>
                </View>
              }
              contentContainerStyle={{
                paddingBottom: 80,
              }}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>

      </BottomSheet>

      {error && (
        <Text className="text-sm text-redHead-200 font-inter">{error}</Text>
      )}

    </View>
  );
}