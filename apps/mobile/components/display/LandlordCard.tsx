import { View, Text, Image } from "react-native";

import { IMAGES } from "../../constants/images";

import {
  IconMail,
  IconPhone,
  IconMessage2,
} from '@tabler/icons-react-native';
import PillButton from "components/buttons/PillButton";

interface LandlordCardProps {
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
}

export default function LandlordCard({
  fullName,
  email,
  phoneNumber,
  profilePictureUrl
}: LandlordCardProps) {
  return (
    <View className="border-2 border-grey-300 p-4 rounded-2xl flex-row items-start gap-4">
      {/* Profile Picture */}
      <View className="w-36 h-36 rounded-xl overflow-hidden border border-grey-300">
        <Image
          source={IMAGES.defaultProfilePicture || profilePictureUrl}
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
            <Text className="text-base text-grey-500 font-inter">
              {email}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <IconPhone size={20} color="#999" />
            <Text className="text-base text-grey-500 font-inter">
              {phoneNumber}
            </Text>
          </View>
        </View>

        <PillButton
          label={"Message"}
          size="sm"
          type="outline"
          leftIconName={IconMessage2}
        />
      </View>
    </View>
  );
}
