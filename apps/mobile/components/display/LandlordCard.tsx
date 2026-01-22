import { View, Text } from "react-native";


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
    <View>
      <Text>
        Landlord
      </Text>
    </View>
  );
}
