import { useState, useMemo } from 'react';
import { View, Text, Pressable, Keyboard } from 'react-native';

import { 
  BottomSheet, 
  Input, 
  useBottomSheetAwareHandlers,
  Separator,
} from 'heroui-native';

import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import {
  Check,
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
  onSelect: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
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
  disabled = false,
}: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isDisabled = !!disabled;

  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return options;
    return options.filter((o) =>
      o.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, enableSearch]);

  const handleOpenChange = (open: boolean) => {
    if (isDisabled) {
      if (open) setIsOpen(false);
      return;
    }

    if (open) Keyboard.dismiss(); 
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
            disabled={isDisabled}
            style={{ alignItems: 'center' }} 
            className={`border-2 rounded-2xl pl-3 pr-4 h-12 flex-row items-center
              justify-between shadow-xs ${
                isDisabled
                  ? 'bg-gray-100 border-gray-200'
                  : error
                  ? 'bg-white border-redHead-200'
                  : isOpen
                  ? 'bg-white border-primary'
                  : 'bg-white border-gray-200'
              }`}
          >
            <Text
              className={`font-inter ${
                isDisabled ? 'text-gray-400' : value ? 'text-text' : 'text-gray-500'
              }`}
            >
              {value || placeholder}
            </Text>

            {isOpen ? (
              <ChevronUp size={20} color={COLORS.text} />
            ) : (
              <ChevronDown size={20} color={COLORS.text} />
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
              renderItem={({ item }: { item: string }) => {
                const isSelected = item === value;

                return (
                  <>
                    <Pressable
                      className={`p-3 rounded-xl flex-row items-center justify-between ${isSelected ? 'bg-primary/10' : 'bg-transparent'}`}
                      onPress={() => {
                        onSelect(isSelected ? null : item);
                        setIsOpen(false);
                      }}
                    >
                      <Text className="text-base text-text text-left font-inter">
                        {item}
                      </Text>

                      {isSelected && <Check size={20} color={COLORS.primary} />}
                    </Pressable>

                    <Separator className="bg-gray-300 my-1" />
                  </>
                )
              }}
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