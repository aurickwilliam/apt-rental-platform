import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { DEFAULT_IMAGES } from "constants/images";

import { formatCurrency } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";

import { Button } from "heroui-native";

import { 
  ChevronLeft,
  BedDouble,
  Bath,
  Home,
  MapPin,
  Maximize,
  Star,
} from "lucide-react-native";

export default function ApartmentSummary() {
  const { colors } = useColors();
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const insets = useSafeAreaInsets();

  // Variable and Functions for the carousel
  // Refs for ScrollView
  const imageScrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const { width } = Dimensions.get("window");

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  // TODO: Fetch apartment details using the apartmentId from the params and replace the dummy data below
  // Dummy Data for apartment images
  const apartmentImages = [
    { id: 1, image: DEFAULT_IMAGES.defaultThumbnail },
    { id: 2, image: DEFAULT_IMAGES.defaultProfilePicture },
    // {id: 3, image: DEFAULT_IMAGES.defaultThumbnail},
  ];

  // Dummy Data for Apartment Details
  const apartmentDetails = {
    name: "Sample Apartment",
    type: "Condominium",
    ratings: "4.5",
    location: "Sample Location",
    monthlyRent: 1200,
    noBedroom: 2,
    noBathroom: 1,
    areaSqm: 85,
    perks: ["wifi", "ac", "tv", "kitchen", "parking", "hotwater", "bath"],
    description: `Good day! I am renting out my 2-bedroom fully furnished apartment located in a safe and accessible area. The unit is on the 5th floor of a well-maintained building with 24/7 security and CCTV.

The apartment includes a spacious living room with sofa set and TV, a dining area, and a modern kitchen equipped with a refrigerator, electric stove, microwave, and cabinets. Both bedrooms are air-conditioned and come with built-in closets. The master bedroom has its own bathroom, while there is also a separate common bathroom for guests.

The unit has a balcony with good ventilation and natural lighting, and a dedicated laundry area with washing machine provision. Water and electricity are individually metered.

The building is near malls, schools, hospitals, and public transportation, making it very convenient for working professionals or small families.

Monthly Rent: ₱25,000
Terms: 1 month advance + 2 months deposit
Minimum stay: 6 months
No pets / No smoking inside the unit

Serious tenants only. Please message me for viewing and inquiries.`,
    landlordId: 1,
    landlordName: "John Doe",
    LandlordProfilePicture: DEFAULT_IMAGES.defaultProfilePicture,
  };

  const formattedMonthlyRent = formatCurrency(apartmentDetails.monthlyRent);

  return (
    <ScreenWrapper noTopPadding>
      <View className="h-full bg-background relative">
        {/* Image Carousel */}
        <ScrollView
          ref={imageScrollViewRef}
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {/* Render Individual Images */}
          {apartmentImages.map((item) => (
            <TouchableOpacity
              activeOpacity={0.9}
              className="w-screen h-full"
              key={item.id}
            >
              <Image
                source={item.image}
                style={{ height: "100%", width: "100%" }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text Details on top of the Carousel*/}
        {/* Linear Gradient Overlay*/}
        <LinearGradient
          colors={["transparent", "#000000"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "flex-end",
            padding: 20,
          }}
          pointerEvents="box-none"
        >
          {/* Apartment Details*/}
          <View pointerEvents="none">
            <Text className="text-white font-interSemiBold text-2xl">
              {apartmentDetails.name}
            </Text>

            <View className="flex-row items-center mt-2 gap-2">
              <MapPin size={24} color={colors.secondaryForeground} />
              <Text className="text-secondary-foreground font-interMedium text-base">
                {apartmentDetails.location}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-8 gap-6">
              <View className="flex-row items-center gap-2">
                <Home size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartmentDetails.type}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Star size={20} color={colors.secondary} fill={colors.secondary} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartmentDetails.ratings} (70)
                </Text>
              </View>
            </View>

            <View
              className="flex-row items-center justify-between my-5 gap-6"
              pointerEvents="none"
            >
              <View className="flex-row items-center gap-2">
                <BedDouble size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartmentDetails.noBedroom} Bedrooms
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Bath size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartmentDetails.noBathroom} Bathrooms
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Maximize size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartmentDetails.areaSqm} Sqm
                </Text>
              </View>
            </View>

            {/* Landlord Details */}
            <View className="flex-row items-center gap-3" pointerEvents="none">
              <View className="size-16 overflow-hidden rounded-full border border-border">
                <Image
                  source={apartmentDetails.LandlordProfilePicture}
                  style={{ width: "100%", height: "100%" }}
                />
              </View>

              <View className="flex items-start justify-center">
                <Text className="text-secondary-foreground font-inter text-sm">
                  Rental Owner
                </Text>
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartmentDetails.landlordName}
                </Text>
              </View>
            </View>

            {/* Monthly Rent */}
            <View className="mt-5 mb-10" pointerEvents="none">
              <Text className="text-secondary-foreground font-interSemiBold text-2xl">
                ₱ {formattedMonthlyRent}/month
              </Text>
            </View>
          </View>

          {/* Pagination Dots */}
          <View
            className="flex-row justify-center items-center"
            pointerEvents="none"
          >
            {apartmentImages.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  className="h-2 bg-white rounded mx-1"
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

          {/* Continue Button */}
          <View className="mt-5">
            <Button 
              onPress={() => {
                router.push(`/apartment/${apartmentId}/apply/first-process`);
              }} 
            >
              <Button.Label>
                Continue Application
              </Button.Label>
            </Button>
          </View>
        </LinearGradient>

        {/* Back Button */}
        <View className="absolute left-4" style={{ top: insets.top + 8 }}>
          <Button onPress={() => router.back()} variant="tertiary" isIconOnly>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
