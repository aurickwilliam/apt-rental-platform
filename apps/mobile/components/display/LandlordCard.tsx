import { View, Text, Image, TouchableOpacity } from "react-native";

import { IMAGES } from "../../constants/images";

import {
  IconMail,
  IconPhone,
  IconMessage2,
  IconStarFilled,
  IconHomeFilled,
} from '@tabler/icons-react-native';
import PillButton from "components/buttons/PillButton";
import { COLORS } from "constants/colors";

interface LandlordCardProps {
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  withRentalInfo?: boolean;
  averageRating?: number;
  totalRentals?: number;
  onPress?: () => void;
  onMessagePress?: () => void;
}

export default function LandlordCard({
  fullName,
  email,
  phoneNumber,
  profilePictureUrl,
  withRentalInfo = false,
  averageRating = 0.0,
  totalRentals = 0,
  onPress,
  onMessagePress,
}: LandlordCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      className="border-2 border-grey-300 p-2 rounded-2xl flex gap-3"
    >
      <View className="flex-row items-start gap-4">
        {/* Profile Picture */}
        <View className="w-36 h-36 rounded-xl overflow-hidden border border-grey-300">
          <Image
            source={profilePictureUrl ? { uri: profilePictureUrl } : IMAGES.defaultProfilePicture}
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        {/* Information Details */}
        <View className="flex-1 h-36 justify-between">
          <Text className="font-interSemiBold text-lg text-text">
            {fullName}
          </Text>

          <View className="flex gap-1">
            <View className="flex-row items-center gap-2">
              <IconMail size={20} color="#999" />
              <Text className="text-sm text-grey-500 font-inter">
                {email}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <IconPhone size={20} color="#999" />
              <Text className="text-sm text-grey-500 font-inter">
                {phoneNumber}
              </Text>
            </View>

          </View>

          {
            withRentalInfo ? (
              <View className="flex-row items-center gap-5 mb-3">
                {/* Ratings */}
                <View className="flex-row items-center gap-2">
                  <IconStarFilled 
                    size={16} 
                    color={COLORS.yellowish} 
                  />
                  <Text className="text-text text-sm font-inter">
                    {averageRating}
                  </Text>
                </View>

                {/* Total Rentals */}
                <View className="flex-row items-center gap-2">
                  <IconHomeFilled 
                    size={16} 
                    color={COLORS.text} 
                  />
                  <Text className="text-text text-sm font-inter">
                    {totalRentals}
                  </Text>
                </View>
              </View>
            ) : (
              <PillButton
                label={"Message"}
                size="sm"
                type="outline"
                leftIconName={IconMessage2}
                onPress={onMessagePress}
              />
            )
          }
        </View>
      </View>

      {
        withRentalInfo && (
          <PillButton
            label={"Message"}
            size="sm"
            type="outline"
            leftIconName={IconMessage2}
            onPress={onMessagePress}
          />
        )
      }
    </TouchableOpacity>
  );
}
