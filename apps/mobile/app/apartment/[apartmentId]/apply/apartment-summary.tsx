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

import { formatCurrency } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";
import { useApartmentDetails } from "@/hooks/useApartmentDetails";
import { useApplicationFormStore } from "@/stores/useApplicationFormStore";

import { Button, Spinner } from "heroui-native";

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

  const { apartment, loading, error } = useApartmentDetails(apartmentId);
  const { setApartmentId, setMaxOccupants } = useApplicationFormStore();

  const imageScrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const { width } = Dimensions.get("window");

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const handleContinueApplication = () => {
    setApartmentId(apartmentId);
    setMaxOccupants(apartment?.max_occupants ?? null);
    router.push(`/apartment/${apartmentId}/apply/first-process`);
  };

  if (loading) {
    return (
      <ScreenWrapper noTopPadding>
        <View className="h-full items-center justify-center bg-background">
          <Spinner />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !apartment) {
    return (
      <ScreenWrapper noTopPadding>
        <View className="h-full items-center justify-center bg-background p-5">
          <Text className="text-center text-textPrimary">
            {error ?? "Apartment not found."}
          </Text>
          <Button onPress={() => router.back()} className="mt-4">
            <Button.Label>Go Back</Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  const sortedImages = [...apartment.apartment_images].sort((a, b) =>
    a.is_cover === b.is_cover ? 0 : a.is_cover ? -1 : 1
  );

  const location = [apartment.barangay, apartment.city, apartment.province]
    .filter(Boolean)
    .join(", ");

  const landlordName = apartment.landlord
    ? `${apartment.landlord.first_name} ${apartment.landlord.last_name}`
    : "Unknown";

  const formattedMonthlyRent = formatCurrency(apartment.monthly_rent);

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
          {sortedImages.length > 0 ? (
            sortedImages.map((item) => (
              <TouchableOpacity
                activeOpacity={0.9}
                className="w-screen h-full"
                key={item.id}
              >
                <Image
                  source={{ uri: item.url }}
                  style={{ height: "100%", width: "100%" }}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View className="w-screen h-full bg-surface" />
          )}
        </ScrollView>

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
          <View pointerEvents="none">
            <Text className="text-white font-interSemiBold text-2xl">
              {apartment.name}
            </Text>

            <View className="flex-row items-center mt-2 gap-2">
              <MapPin size={24} color={colors.secondaryForeground} />
              <Text className="text-secondary-foreground font-interMedium text-base">
                {location}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-8 gap-6">
              <View className="flex-row items-center gap-2">
                <Home size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartment.type}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Star size={20} color={colors.secondary} fill={colors.secondary} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartment.average_rating?.toFixed(1) ?? "N/A"} ({apartment.no_ratings})
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
                  {apartment.no_bedrooms} Bedrooms
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Bath size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartment.no_bathrooms} Bathrooms
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Maximize size={24} color={colors.secondaryForeground} />
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {apartment.area_sqm} Sqm
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3" pointerEvents="none">
              <View className="size-16 overflow-hidden rounded-full border border-border">
                {apartment.landlord?.avatar_url ? (
                  <Image
                    source={{ uri: apartment.landlord.avatar_url }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : null}
              </View>

              <View className="flex items-start justify-center">
                <Text className="text-secondary-foreground font-inter text-sm">
                  Rental Owner
                </Text>
                <Text className="text-secondary-foreground font-interMedium text-base">
                  {landlordName}
                </Text>
              </View>
            </View>

            <View className="mt-5 mb-10" pointerEvents="none">
              <Text className="text-secondary-foreground font-interSemiBold text-2xl">
                ₱ {formattedMonthlyRent}/month
              </Text>
            </View>
          </View>

          <View
            className="flex-row justify-center items-center"
            pointerEvents="none"
          >
            {sortedImages.map((_, index) => {
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
                  style={[{ width: dotWidth, opacity }]}
                />
              );
            })}
          </View>

          <View className="mt-5">
            <Button onPress={handleContinueApplication}>
              <Button.Label>Continue Application</Button.Label>
            </Button>
          </View>
        </LinearGradient>

        <View className="absolute left-4" style={{ top: insets.top + 8 }}>
          <Button onPress={() => router.back()} variant="tertiary" isIconOnly>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}