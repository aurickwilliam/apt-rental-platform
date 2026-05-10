import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import IconButton from 'components/buttons/IconButton';
import { IconChevronLeft, IconHeart } from '@tabler/icons-react-native';

type ApartmentSkeletonProps = {
  onBackPress: () => void;
  onFavoritePress: () => void;
};

export default function ApartmentSkeleton({
  onBackPress,
  onFavoritePress,
}: ApartmentSkeletonProps) {
  const skeletonOpacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [skeletonOpacity]);

  const SkeletonBlock = ({
    className,
    style,
  }: {
    className?: string;
    style?: object;
  }) => (
    <Animated.View
      className={`bg-grey-200 rounded-xl ${className ?? ''}`}
      style={[{ opacity: skeletonOpacity }, style]}
    />
  );

  return (
    <View className='flex-1'>
      <ScreenWrapper scrollable bottomPadding={100} noTopPadding>
        <View className='h-[42rem] bg-darkerWhite p-5 justify-end'>
          <View className='gap-3'>
            <SkeletonBlock className='h-8 w-3/4' />
            <SkeletonBlock className='h-5 w-11/12' />
            <SkeletonBlock className='h-5 w-40 mt-2' />

            <View className='flex-row mt-3 gap-3'>
              <SkeletonBlock className='h-5 flex-1' />
              <SkeletonBlock className='h-5 flex-1' />
              <SkeletonBlock className='h-5 flex-1' />
            </View>

            <View className='flex-row mt-3 gap-3'>
              <SkeletonBlock className='h-5 flex-1' />
              <SkeletonBlock className='h-5 flex-1' />
            </View>
          </View>
        </View>

        <View className='px-5 mt-6 gap-4'>
          <SkeletonBlock className='h-6 w-2/3' />
          <View className='p-4 bg-darkerWhite rounded-2xl gap-2'>
            <SkeletonBlock className='h-4 w-full' />
            <SkeletonBlock className='h-4 w-full' />
            <SkeletonBlock className='h-4 w-5/6' />
            <SkeletonBlock className='h-9 w-32 mt-3' />
          </View>

          <SkeletonBlock className='h-6 w-1/2 mt-2' />
          <View className='flex-row flex-wrap'>
            <View className='w-1/2 pr-2 mb-3'>
              <SkeletonBlock className='h-10 w-full' />
            </View>
            <View className='w-1/2 pl-2 mb-3'>
              <SkeletonBlock className='h-10 w-full' />
            </View>
            <View className='w-1/2 pr-2 mb-3'>
              <SkeletonBlock className='h-10 w-full' />
            </View>
            <View className='w-1/2 pl-2 mb-3'>
              <SkeletonBlock className='h-10 w-full' />
            </View>
          </View>

          <SkeletonBlock className='h-56 w-full rounded-2xl mt-2' />

          <SkeletonBlock className='h-6 w-1/3 mt-2' />
          <SkeletonBlock className='h-24 w-full rounded-2xl' />
          <SkeletonBlock className='h-24 w-full rounded-2xl' />

          <SkeletonBlock className='h-6 w-1/2 mt-2' />
          <SkeletonBlock className='h-28 w-full rounded-2xl' />

          <SkeletonBlock className='h-6 w-1/2 mt-2' />
          <SkeletonBlock className='h-10 w-52' />
        </View>

        <View className='h-20' />
      </ScreenWrapper>

      <View className='absolute bottom-0 left-0 right-0 bg-white z-10 px-5 py-4 border-t border-grey-200'>
        <SafeAreaView
          className='flex items-start justify-between gap-3'
          edges={['bottom']}
        >
          <View className='flex-1 flex-row gap-5 items-center w-full'>
            <SkeletonBlock className='h-9 w-36' />
            <View className='flex-1'>
              <SkeletonBlock className='h-11 w-full rounded-full' />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView className='absolute left-4 top-5' edges={['top']}>
        <IconButton iconName={IconChevronLeft} onPress={onBackPress} />
      </SafeAreaView>

      <SafeAreaView className='absolute right-4 top-5' edges={['top']}>
        <IconButton iconName={IconHeart} onPress={onFavoritePress} />
      </SafeAreaView>
    </View>
  );
}
