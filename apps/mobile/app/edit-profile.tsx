import { Text, View } from "react-native";
import { Button, Spinner } from "heroui-native";
import { Redirect } from "expo-router";

import EditProfileForm from "@/components/profile/EditProfileForm";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { choosePortal } from "@/service/auth/portalPreference";

export default function EditProfile() {
  const { data: profile, isLoading, refetch } = useCurrentUser();

  if (profile && !choosePortal(profile.roles, null)) return <Redirect href="/" />;

  if (profile) {
    // Initialize the draft once per account, not on every background refetch.
    return <EditProfileForm key={profile.user_id} profile={profile} />;
  }

  return (
    <ScreenWrapper header={<StandardHeader title="Edit Profile" />}>
      <View className="flex-1 items-center justify-center gap-4 p-5">
        {isLoading ? <Spinner size="lg" accessibilityLabel="Loading profile" /> : (
          <>
            <Text className="text-foreground font-inter text-center">Unable to load your profile. Please try again.</Text>
            <Button variant="secondary" onPress={() => void refetch()}><Button.Label>Try Again</Button.Label></Button>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
