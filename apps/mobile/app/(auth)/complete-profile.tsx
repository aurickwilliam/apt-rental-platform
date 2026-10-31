import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useRef } from 'react';

import { usePasswordValidation } from '@repo/hooks';

import ScreenWrapper, { type ScreenWrapperScrollRef } from 'components/layout/ScreenWrapper';
import ProfileDetailsFields from '@/components/profile/ProfileDetailsFields';
import NewPasswordFields from '@/components/inputs/NewPasswordFields';
import ErrorDialog from '@/components/display/ErrorDialog';
import RegistrationPolicyAcceptance from '@/components/legal/RegistrationPolicyAcceptance';

import { useProfileDetailsForm } from '@/hooks/auth/useProfileDetailsForm';
import { useSignUpProfile } from '@/hooks/auth/useSignUpProfile';
import { isPortal } from '@/service/auth/portalPreference';
import { firstParam } from '@/utils/routeParams';

import { useColors } from 'hooks/useTheme';

import {
  CloseButton,
  Button,
  Separator,
  Spinner,
} from 'heroui-native';

// Profile step of email sign-up: the account does not exist yet, so besides
// the shared details it asks for the password.
export default function CompleteProfile() {
  const { colors } = useColors();

  const params = useLocalSearchParams();
  const email = firstParam(params.email) ?? '';
  const userSide = firstParam(params.userSide);
  const role = isPortal(userSide) ? userSide : 'tenant';

  const scrollRef = useRef<ScreenWrapperScrollRef>(null);
  const form = useProfileDetailsForm({ scrollRef });
  const passwords = usePasswordValidation();
  const { submit, goBack, loading, error, errorDialogOpen, closeErrorDialog, policies } = useSignUpProfile({
    form,
    passwords,
    email,
    userSide: role,
  });

  const getPasswordError = (field: 'password' | 'confirmPassword') => {
    if (!form.submitted) return undefined;

    if (field === 'password') {
      if (!passwords.password) return 'This field is required';
      if (!passwords.isPasswordValid) {
        return 'Password does not meet the requirements or password does not match';
      }
      return undefined;
    }

    if (!passwords.confirmPassword) return 'This field is required';
    if (passwords.password !== passwords.confirmPassword) return 'Passwords do not match';
    return undefined;
  };

  return (
    <ScreenWrapper scrollable ref={scrollRef} className="p-5">
      <CloseButton
        onPress={goBack}
        iconProps={{ size: 20, color: colors.textPrimary }}
      />

      <Text className="text-2xl text-foreground font-nunitoBold my-5">
        Complete Your {role === "landlord" ? "Landlord " : "Tenant"} Profile
      </Text>

      <View className="flex gap-4">
        <ProfileDetailsFields form={form} email={email} />

        <Separator />

        <Text className="text-xl text-foreground font-nunitoBold mt-3">
          Account Security
        </Text>

        <View {...form.trackPosition('password')}>
          <NewPasswordFields
            password={passwords.password}
            confirmPassword={passwords.confirmPassword}
            onPasswordChange={passwords.setPassword}
            onConfirmPasswordChange={passwords.setConfirmPassword}
            requirements={passwords.passwordRequirements}
            passwordError={getPasswordError('password')}
            confirmPasswordError={getPasswordError('confirmPassword')}
          />
        </View>
      </View>

      <View className="mt-16 mb-0">
        <RegistrationPolicyAcceptance form={policies} isDisabled={loading} />
        <Button onPress={submit} isDisabled={loading || !policies.canSubmit}>
          <Button.Label>{loading ? "Please wait..." : "Submit"}</Button.Label>
          {loading && (
            <Spinner size="sm" color={colors.white} className="ml-2" />
          )}
        </Button>
      </View>

      <ErrorDialog
        isOpen={errorDialogOpen}
        onClose={closeErrorDialog}
        message={error}
      />
    </ScreenWrapper>
  );
}
