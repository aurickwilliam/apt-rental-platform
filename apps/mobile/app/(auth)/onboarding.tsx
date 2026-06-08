import { useState, useRef } from 'react';
import { Link } from 'expo-router';

import {
  View,
  Dimensions,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { SLIDES } from './data/onboarding-data';
import { USER_ROLES } from './data/user-role';

import OnBoardingSlide from 'components/layout/OnBoardingSlide';

import { Button } from "heroui-native"

// Get the device width
const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // First: Updates the scrollX every move of the scroll
  // Second: Every scroll, it runs the listener function, sets the currentIndex
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);

        setCurrentIndex(index);
      },
    }
  );

  const goToNext = () => {
    // Move the scroll depending on the currentIndex and width of the screen
    // The ScrollView moves the X axis
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    }
  };

  // Scroll to the very end of the ScrollView
  const skip = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View className='flex-1 bg-white'>

      {/* Image Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* Generate all the slides */}
        {SLIDES.map((slide) => (
          <OnBoardingSlide
            key={slide.id}
            slide={slide}
            width={width}
          />
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View className='flex-row justify-center items-center mb-16'>
        {SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              className='h-2 bg-primary rounded mx-1'
              style={[
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Bottom Buttons */}
      <View className='flex-row items-center justify-between gap-8 px-5 mb-8'>
        {
          currentIndex < SLIDES.length - 1 ? (
            <>
              <Button
                onPress={skip}
                variant="secondary"
                className="flex-1"
              >
                <Button.Label>
                  Skip
                </Button.Label>
              </Button>

              <Button
                onPress={goToNext}
                variant="primary"
                className="flex-1"
              >
                <Button.Label>
                  Next
                </Button.Label>
              </Button>
            </>
          ) : (

            // Generate User Role Buttons
            USER_ROLES.map((role) => (
              <View key={role.userType} className='flex-1'>
                <Link
                  href={`/sign-up?userType=${role.userType}`}
                  asChild
                  replace={true}
                >
                  <Button
                    variant={role.type === "primary" ? "primary" : "secondary"}
                    className={role.type !== "primary" ? "bg-secondary" : undefined}
                  >
                    <Button.Label className={role.type !== "primary" ? "text-white" : undefined}>
                      {role.label}
                    </Button.Label>
                  </Button>
                </Link>
              </View>
            ))
          )
        }
      </View>
    </View>
  );
}
