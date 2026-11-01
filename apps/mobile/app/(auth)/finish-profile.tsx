import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react';

import ScreenWrapper, { type ScreenWrapperScrollRef } from 'components/layout/ScreenWrapper';
import ProfileDetailsFields from '@/components/profile/ProfileDetailsFields';
import ErrorDialog from '@/components/display/ErrorDialog';
import RegistrationPolicyAcceptance from '@/components/legal/RegistrationPolicyAcceptance';
import RoleTab from './components/RoleTab';

import { useProfileDetailsForm } from '@/hooks/auth/useProfileDetailsForm';
import { useFinishProfile } from '@/hooks/auth/useFinishProfile';
import { readFinishProfileParams } from '@/service/auth/finishProfileRoute';
import { isPortal, type Portal } from '@/service/auth/portalPreference';

import { useColors } from "hooks/useTheme";

import {
  Button,
  LinkButton,
  Spinner,
} from 'heroui-native';

// Completes the profile of an account that already exists (first Google
// sign-in, interrupted sign-up, or an incomplete profile opened from the
// profile tab). No password: the account is already signed in.
export default function FinishProfile() {
  const { colors } = useColors();

  const { email, firstName, lastName, requestedRole, initialRole, isProfileMissing } =
    readFinishProfileParams(useLocalSearchParams());
  const [selectedRole, setSelectedRole] = useState<Portal>(initialRole);

  const scrollRef = useRef<ScreenWrapperScrollRef>(null);
  const form = useProfileDetailsForm({ firstName, lastName, scrollRef });
  const { submit, signOut, loading, error, errorDialogOpen, closeErrorDialog, policies } = useFinishProfile({
    form,
    role: selectedRole,
    requestedRole,
  });

  return (
    <ScreenWrapper scrollable ref={scrollRef} className="p-5">
      <Text className="text-2xl text-foreground font-nunitoBold my-5">
        Complete Your {selectedRole === "landlord" ? "Landlord " : "Tenant"} Profile
      </Text>

      {requestedRole === undefined && (
        <View className="mb-5">
          <Text className="text-base text-foreground font-nunitoSemiBold">Choose your account type</Text>
          <RoleTab userSide={selectedRole} onValueChange={(value) => {
            if (isPortal(value)) setSelectedRole(value);
          }} />
        </View>
      )}

      <View className="flex gap-4">
        <ProfileDetailsFields form={form} email={email} />
      </View>

      <View className="mt-16 mb-0">
        <RegistrationPolicyAcceptance form={policies} isDisabled={loading} />
        <Button onPress={submit} isDisabled={loading || !policies.canSubmit}>
          <Button.Label>{loading ? "Please wait..." : "Submit"}</Button.Label>
          {loading && (
            <Spinner size="sm" color={colors.white} className="ml-2" />
          )}
        </Button>

        {isProfileMissing && (
          <LinkButton onPress={signOut} isDisabled={loading} className="mt-4 self-center p-0">
            <LinkButton.Label className="text-accent font-nunitoSemiBold underline">
              Use a different account
            </LinkButton.Label>
          </LinkButton>
        )}
      </View>

      <ErrorDialog
        isOpen={errorDialogOpen}
        onClose={closeErrorDialog}
        message={error}
      />
    </ScreenWrapper>
  );
}
