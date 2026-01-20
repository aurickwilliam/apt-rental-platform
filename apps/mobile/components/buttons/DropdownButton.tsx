import { useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';

import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import {
  IconCaretDownFilled,
  IconCaretUpFilled,
  IconProps,
} from "@tabler/icons-react-native";

import { COLORS } from '../../constants/colors';

interface DropdownButtonProps {
  bottomSheetLabel: string;
  options: string[];
  value?: string | null;
  onSelect: (value: any) => void;
  buttonClassName?: string;
  textClassName?: string;
  iconProps?: IconProps;
  openIcon?: React.ComponentType<IconProps>;
  closeIcon?: React.ComponentType<IconProps>;
}

export default function DropdownButton({
  bottomSheetLabel,
  options,
  value,
  onSelect,
  buttonClassName,
  textClassName,
  iconProps = {size: 26, color: COLORS.text},
  openIcon = IconCaretUpFilled,
  closeIcon = IconCaretDownFilled,
}: DropdownButtonProps) {
  
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '75%'], []);

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

  const Icon = isFocused ? openIcon : closeIcon;

  // Default style for button and text
  const defaultButtonClassName = 'bg-darkerWhite px-2 py-1 rounded-xl flex-row items-center justify-start self-start gap-1';
  const defaultTextClassName = 'text-text text-base font-interMedium';

  return (
    <>
      {/* Button */}
      <TouchableOpacity
        className={buttonClassName || defaultButtonClassName}
        onPress={openSheet}
      >
        <Text className={textClassName || defaultTextClassName}>
          {value}
        </Text>

        <Icon 
          {...iconProps}
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
          data={options}
          keyExtractor={(item: string) => item}
          renderItem={({ item }: { item: string }) => (
            <Pressable
              className='p-4 rounded-lg bg-darkerWhite mb-2'
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
    </>
  );
}