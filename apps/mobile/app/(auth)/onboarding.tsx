import { useState, useRef } from 'react';
import {
  View,
  Dimensions,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Link } from 'expo-router';

import { SLIDES } from "@/constants/onboarding-data";
import OnBoardingSlide from '@/components/OnBoardingSlide';
import PillButton from '@/components/PillButton';

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

  const skip = () => {
    // Scroll to the very end of the ScrollView
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // User Role Buttons Data
  interface UserRole {
    label: string,
    type: 'primary' | 'secondary',
    userType: 'landlord' | 'tenant',
  }

  const userRoles: UserRole[] = [
    {
      label: "I'm a Landlord", 
      type: 'secondary', 
      userType: 'landlord'
    },
    {
      label: "I'm a Tenant", 
      type: 'primary', 
      userType: 'tenant'
    },
  ]

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
      <View className='flex-row items-center justify-between gap-8 px-10 mb-10'>
        {
          currentIndex < SLIDES.length - 1 ? (
            <>
              <View className='flex-1'>
                <PillButton 
                  label="Skip"
                  type="outline"
                  isFullWidth={true}
                  onPress={skip}
                />
              </View>
              
              <View className='flex-1'>
                <PillButton 
                  label="Next"
                  isFullWidth={true}
                  onPress={goToNext}
                />
              </View>
            </>
          ) : (

            // Generate User Role Buttons
            userRoles.map((role) => (
              <View key={role.userType} className='flex-1'>
                <Link 
                  href={`/sign-up?userType=${role.userType}`} 
                  asChild
                  replace={true}
                >

                  <PillButton 
                    label={role.label}
                    type={role.type}
                    isFullWidth={true}
                  />

                </Link>
              </View>
            ))

          )
        }
      </View>
    </View>
  );
}