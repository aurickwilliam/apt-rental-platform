import { useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';

import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@repo/constants';

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
  searchPlaceholder = 'Search...'
}: DropdownFieldProps) {
  
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!enableSearch || searchQuery.trim() === '') {
      return options;
    }

    return options.filter((option: string) =>
      option.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, enableSearch]);

  const openSheet = useCallback(() => {
    setIsFocused(true);
    bottomSheetRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    setIsFocused(false);
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleOnDismiss = useCallback(() => {
    setIsFocused(false);
    setSearchQuery('');
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <View className='w-full flex-col gap-2'>

      {/* Label Text */}
      <Text className='text-md text-text font-interMedium'>
        {label} {required && <Text className='text-redHead-200'>*</Text>}
      </Text>

      {/* Trigger Field */}
      <TouchableOpacity
        className={`bg-white border-2 rounded-2xl pl-3 pr-4 h-16 flex-row items-center 
          justify-between ${error ? 'border-redHead-200' : 
          isFocused ? 'border-primary' : 'border-gray-200'}`}
        onPress={openSheet}
      >
        <Text className={`text-lg font-inter ${value ? 'text-text' : 'text-gray-400'}`}>
          {value || placeholder}
        </Text>

        <Ionicons 
          name={`${isFocused ? 'caret-up' : 'caret-down'}`}
          size={24}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0} 
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        keyboardBehavior='extend'
        keyboardBlurBehavior='restore'
        android_keyboardInputMode='adjustResize'

        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        handleIndicatorStyle={{
          backgroundColor: '#ccc',
          width: 40,
        }}
        style={{ zIndex: 9999 }}
        onDismiss={handleOnDismiss}
      >
        <BottomSheetFlatList
          data={filteredOptions}
          keyExtractor={(item: string) => item}
          renderItem={({ item }: { item: string }) => (
            <Pressable
              className='p-4 rounded-lg border-b border-grey-100'
              onPress={() => {
                onSelect(item);
                closeSheet();
              }}
            >
              <Text className='text-lg text-text text-left font-inter'>{item}</Text>
            </Pressable>
          )}

          ListHeaderComponent={
            <View>
              <Text className='text-lg text-center text-text font-interMedium border-b
                border-grey-200 pb-3 mb-4'>
                {bottomSheetLabel}
              </Text>

              {
                enableSearch && 
                <BottomSheetTextInput
                  className='w-full p-4 mb-2 text-lg text-text border-2 border-grey-200 rounded-2xl font-inter'
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              }

            </View>
          }

          ListEmptyComponent={
            <View className='h-full py-8 items-center justify-center'>
              <Text className='text-lg text-gray-500 font-inter'>
                {searchQuery.trim() ? 'No results found' : 'No options available'}
              </Text>
            </View>
          }

          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 80,
          }}
        />
      </BottomSheetModal>
    </View>
  );
}