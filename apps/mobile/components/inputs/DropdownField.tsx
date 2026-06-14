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

import { useColors } from "hooks/useTheme";

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
  const { colors } = useColors();

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

      <Text className={`text-base font-interMedium ${error ? 'text-danger' : 'text-foreground'}`}>
        {label} {required && <Text className="text-danger">*</Text>}
      </Text>

      <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>

        <BottomSheet.Trigger asChild>
          <Pressable
            disabled={isDisabled}
            style={{ alignItems: 'center' }}
            className={`border rounded-2xl pl-3 pr-4 h-12 flex-row items-center
              justify-between shadow-xs ${
                isDisabled
                  ? 'bg-surface-tertiary border-field-border'
                  : error
                  ? 'bg-surface border-danger'
                  : isOpen
                  ? 'bg-surface border-focus'
                  : 'bg-surface border-field-border'
              }`}
          >
            <Text
              className={`font-inter ${
                isDisabled ? 'text-gray-400' : value ? 'text-foreground' : 'text-gray-500'
              }`}
            >
              {value || placeholder}
            </Text>

            {isOpen ? (
              <ChevronUp size={20} color={colors.textPrimary} />
            ) : (
              <ChevronDown size={20} color={colors.textPrimary} />
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
            backgroundClassName="bg-surface-secondary"
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
                      className={`p-3 rounded-xl flex-row items-center justify-between ${isSelected ? 'bg-accent/10' : 'bg-transparent'}`}
                      onPress={() => {
                        onSelect(isSelected ? null : item);
                        setIsOpen(false);
                      }}
                    >
                      <Text className="text-base text-foreground text-left font-inter">
                        {item}
                      </Text>

                      {isSelected && <Check size={20} color={colors.primary} />}
                    </Pressable>

                    <Separator className="bg-gray-300 my-1" />
                  </>
                )
              }}
              ListHeaderComponent={
                <View>
                  <Text className="text-base text-center text-foreground font-interMedium border-b border-gray-200 pb-3 mb-4">
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
        <Text className="text-sm text-danger font-inter">{error}</Text>
      )}

    </View>
  );
}