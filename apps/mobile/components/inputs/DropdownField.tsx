import { useState, useMemo } from 'react';
import { View, Text, Pressable, Keyboard } from 'react-native';

import { 
  BottomSheet, 
  Input, 
  useBottomSheetAwareHandlers,
  Separator,
} from 'heroui-native';

import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react-native'

import { useColors } from "hooks/useTheme";
import { useTranslation } from "@/hooks/i18n";

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
  onSelect?: (value: string | null) => void;
  /** Lets several options be picked; the sheet stays open until dismissed. */
  multiple?: boolean;
  values?: string[];
  onSelectMultiple?: (values: string[]) => void;
  /** Display text for a stored option; defaults to the option itself. */
  optionLabel?: (option: string) => string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export default function DropdownField({
  label,
  bottomSheetLabel,
  options,
  value,
  onSelect,
  multiple = false,
  values = [],
  onSelectMultiple,
  optionLabel,
  placeholder,
  required = false,
  error,
  enableSearch = false,
  searchPlaceholder,
  disabled = false,
  readOnly = false,
}: DropdownFieldProps) {
  const { colors } = useColors();
  const { t } = useTranslation();

  const displayPlaceholder = placeholder ?? t("common.selectValue");
  const displaySearchPlaceholder = searchPlaceholder ?? t("common.searchPlaceholder");
  const labelOf = (option: string) => optionLabel?.(option) ?? option;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isDisabled = !!disabled;
  const isReadOnly = !!readOnly;
  const displayValue = multiple ? values.join(', ') : value;

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

    // Opening hides any keyboard from the screen behind; closing hides the
    // search box's keyboard (it would otherwise stay up over the form).
    Keyboard.dismiss();
    setIsOpen(open);
    if (!open) setSearchQuery('');
  };

  return (
    <View className="w-full flex-col gap-2">
      <Text className={`text-base font-nunitoSemiBold ${error ? 'text-danger' : 'text-foreground'}`}>
        {label} {required && <Text className="text-danger">*</Text>}
      </Text>

      <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
        <BottomSheet.Trigger asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: isDisabled || isReadOnly, expanded: isOpen }}
            disabled={isDisabled || isReadOnly}
            style={{ alignItems: 'center' }}
            className={`rounded-2xl pl-3 pr-4 h-12 flex-row items-center
              justify-between ${
                isDisabled
                  ? 'bg-surface-tertiary border border-field-border'
                  : error
                  ? 'bg-surface border-2 border-danger'
                  : isOpen
                  ? 'bg-surface border-2 border-focus'
                  : 'bg-surface border border-field-border'
              }`}
          >
            <Text
              className={`font-inter ${
                isDisabled 
                  ? 'text-gray-400' 
                  : displayValue
                  ? 'text-foreground' 
                  : 'text-gray-500'
              }`}
            >
              {displayValue
                ? multiple
                  ? values.map(labelOf).join(', ')
                  : labelOf(displayValue)
                : displayPlaceholder}
            </Text>

            {!isReadOnly && (
              isOpen
                ? <IconChevronUp size={20} color={colors.textPrimary} />
                : <IconChevronDown size={20} color={colors.textPrimary} />
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
                const isSelected = multiple ? values.includes(item) : item === value;

                return (
                  <>
                    <Pressable
                      className={`p-3 rounded-xl flex-row items-center justify-between ${isSelected ? 'bg-accent/10' : 'bg-transparent'}`}
                      accessibilityRole={multiple ? 'checkbox' : 'button'}
                      accessibilityState={{ selected: isSelected, checked: multiple ? isSelected : undefined }}
                      onPress={() => {
                        Keyboard.dismiss();
                        if (multiple) {
                          // Keep the options' order, whatever order they were tapped in.
                          const picked = isSelected ? values.filter((v) => v !== item) : [...values, item];
                          onSelectMultiple?.(options.filter((o) => picked.includes(o)));
                          return;
                        }
                        onSelect?.(isSelected ? null : item);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <Text className="text-base text-foreground text-left font-inter">
                        {labelOf(item)}
                      </Text>

                      {isSelected && <IconCheck size={20} color={colors.primary} />}
                    </Pressable>

                    <Separator className="bg-gray-300 my-1" />
                  </>
                )
              }}
              ListHeaderComponent={
                <View>
                  <Text className="text-base text-center text-foreground font-nunitoSemiBold border-b border-gray-200 pb-3 mb-4">
                    {bottomSheetLabel}
                  </Text>
                  {enableSearch && (
                    <SearchInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={displaySearchPlaceholder}
                    />
                  )}
                </View>
              }
              ListEmptyComponent={
                <View className="py-8 items-center justify-center">
                  <Text className="text-lg text-gray-500 font-inter">
                    {searchQuery.trim()
                      ? t("common.noResultsFound")
                      : t("common.noOptions")}
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
