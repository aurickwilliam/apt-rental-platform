import { View } from 'react-native';
import { SkeletonGroup } from 'heroui-native';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import StandardHeader from 'components/layout/StandardHeader';

export default function RateApartmentSkeleton() {
  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Rate Apartment" />}
      className="p-5"
    >
      <SkeletonGroup isLoading className="flex gap-3">
        {/* Apartment Thumbnail */}
        <SkeletonGroup.Item className="w-full h-52 rounded-3xl" />

        <View className="flex mt-3 gap-3">
          {/* Apartment Name and Address */}
          <View className="flex gap-2">
            <SkeletonGroup.Item className="h-6 w-3/4 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
          </View>

          {/* Landlord */}
          <View className="flex gap-1.5">
            <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
          </View>

          {/* Type and Ratings */}
          <View className="flex-row justify-between items-center">
            <View className="flex gap-1.5">
              <SkeletonGroup.Item className="h-3 w-24 rounded-md" />
              <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
            </View>
            <SkeletonGroup.Item className="h-5 w-16 rounded-md" />
          </View>

          {/* Duration of Stay */}
          <View className="flex gap-1.5">
            <SkeletonGroup.Item className="h-3 w-28 rounded-md" />
            <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
          </View>

          <SkeletonGroup.Item className="h-px w-full my-4 rounded-none" />

          {/* Rating Input */}
          <View className="items-center gap-3">
            <SkeletonGroup.Item className="h-5 w-32 rounded-md" />
            <SkeletonGroup.Item className="h-12 w-20 rounded-md" />
            <View className="flex-row gap-3 my-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonGroup.Item key={i} className="h-11 w-11 rounded-full" />
              ))}
            </View>
          </View>

          {/* Review Text Box */}
          <View className="flex gap-1.5 mt-2">
            <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
            <SkeletonGroup.Item className="h-24 w-full rounded-xl" />
          </View>

          {/* Review Photos */}
          <View className="flex gap-1.5">
            <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
            <SkeletonGroup.Item className="h-20 w-full rounded-xl" />
          </View>

          {/* Submit Button */}
          <SkeletonGroup.Item className="h-12 w-full rounded-full mt-4" />
        </View>
      </SkeletonGroup>
    </ScreenWrapper>
  );
}
