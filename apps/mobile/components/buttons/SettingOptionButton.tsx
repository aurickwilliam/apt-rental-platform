import { useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native'

import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import {
  IconProps,
  IconChevronRight,
} from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';
import CustomSwitch from './CustomSwitch';

interface SettingOptionButtonProps {
  label: string;
  iconName?: React.ComponentType<IconProps>; 
  onPress?: () => void;
  hasToggle?: boolean; 
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  hasBottomSheet?: boolean;
  bottomSheetLabel?: string;
  bottomSheetOptions?: string[];
  bottomSheetValue?: string | null;
  onBottomSheetSelect?: (value: string) => void;
}

export default function SettingOptionButton({
  label,  
  iconName,
  onPress,
  hasToggle = false,
  toggleValue = false,
  onToggleChange,
  hasBottomSheet = false,
  bottomSheetLabel = '',
  bottomSheetOptions = [],
  bottomSheetValue,
  onBottomSheetSelect,
}: SettingOptionButtonProps) {

  const Icon = iconName;

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const openSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
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

  const handleToggle = () => {
    if (onToggleChange) {
      onToggleChange(!toggleValue);
    }
  };

  const handlePress = () => {
    if (hasBottomSheet) {
      openSheet();
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <>
      <TouchableOpacity 
        activeOpacity={0.7}
        className='bg-white p-4 rounded-xl flex-row items-center justify-between gap-3'
        onPress={handlePress}
      >
        {
          Icon && (
            <Icon 
              size={24}
              color={COLORS.text}
            />
          )
        }
        <Text className='text-text text-lg font-interMedium flex-1'>
          {label}
        </Text>
        {
          hasToggle ? (
            <CustomSwitch 
              value={toggleValue} 
              onValueChange={handleToggle}
              activeColor={COLORS.secondary}
              inactiveColor={COLORS.lightLightLightGrey}
            />
          ) : (
            <IconChevronRight 
              size={24}
              color={COLORS.mediumGrey}
            />
          )
        }
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      {hasBottomSheet && (
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
        >
          <BottomSheetFlatList
            data={bottomSheetOptions}
            keyExtractor={(item: string) => item}
            renderItem={({ item }: { item: string }) => (
              <Pressable
                className={`p-4 rounded-lg mb-2 ${item === bottomSheetValue ? 'bg-lightBlue' : 'bg-darkerWhite'}`}
                onPress={() => {
                  onBottomSheetSelect?.(item);
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
                  No options available
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
      )}
    </>
  )
}