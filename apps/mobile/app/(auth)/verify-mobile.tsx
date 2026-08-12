import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { IconChevronLeft } from "@tabler/icons-react-native";

import { usePHMobileValidation } from "@repo/hooks";

import { useRegistrationStore } from "@/stores/useRegistrationStore";

import { supabase } from "@repo/supabase";

import { useColors } from "hooks/useTheme";

import ErrorDialog from "@/components/display/ErrorDialog";

import {
  CloseButton,
  TextField,
  Label,
  Input,
  FieldError,
  Button,
} from "heroui-native";

export default function VerifyMobile() {
  const router = useRouter();

  const { colors } = useColors();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const { setData, data } = useRegistrationStore();

  const {
    value: mobileNumber,
    validation,
    onChange,
    validate,
  } = usePHMobileValidation(data.mobileNumber ?? "");

  const handleAndVerifyMobile = async () => {
    const result = validate();
    if (!result.isValid) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email!,
        password: data.password!,
        options: {
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
          },
        },
      });

      if (error) throw error;

      setData({ mobileNumber });

      router.push({
        pathname: "/(auth)/otp-verification",
        params: { email: data.email },
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper className="p-5">
      <View className="flex-1 justify-between">
        <View>
          {/* Back button */}
          <CloseButton
            variant="ghost"
            className="-ml-2"
            onPress={() => router.back()}
          >
            <IconChevronLeft size={26} color={colors.textPrimary} />
          </CloseButton>

          {/* Title */}
          <Text className="text-2xl text-foreground font-interMedium my-5">
            Enter Your Mobile Number
          </Text>

          {/* Mobile Number Field */}
          <TextField isRequired isInvalid={!!validation.errorMessage}>
            <Label>Mobile Number:</Label>
            <Input
              placeholder="09XXXXXXXXX"
              value={mobileNumber}
              onChangeText={onChange}
              maxLength={11}
            />
            {validation.errorMessage && (
              <FieldError>{validation.errorMessage}</FieldError>
            )}
          </TextField>
        </View>

        {/* Verify Button */}
        <Button onPress={handleAndVerifyMobile} isDisabled={loading}>
          <Button.Label>
            {loading ? "Please wait..." : "Continue"}
          </Button.Label>
        </Button>
      </View>

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        message={error}
      />
    </ScreenWrapper>
  );
}