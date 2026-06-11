import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { COLORS } from "@repo/constants";

import { IconChevronLeft, IconAlertCircle } from "@tabler/icons-react-native";

import { usePHMobileValidation } from "@repo/hooks";

import { useRegistrationStore } from "@/stores/useRegistrationStore";

import { supabase } from "@repo/supabase";

import {
  CloseButton,
  TextField,
  Label,
  Input,
  FieldError,
  Button,
  Dialog,
} from "heroui-native";

export default function VerifyMobile() {
  const router = useRouter();

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
            <IconChevronLeft size={26} color={COLORS.text} />
          </CloseButton>

          {/* Title */}
          <Text className="text-2xl text-text font-interMedium my-5">
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
            {loading ? "Please wait..." : "Proceed to OTP Verification"}
          </Button.Label>
        </Button>
      </View>

      {/* Error Dialog */}
      <Dialog isOpen={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" className="absolute top-3 right-3" />

            <View className="mb-5 gap-1.5">
              <View className="flex-row items-center gap-2">
                <IconAlertCircle size={20} color={COLORS.lightRedHead} />
                <Dialog.Title className="text-redHead-100">
                  Something went wrong
                </Dialog.Title>
              </View>
              <Dialog.Description>{error}</Dialog.Description>
            </View>

            <View className="flex-row justify-end">
              <Button
                size="sm"
                onPress={() => setErrorDialogOpen(false)}
                variant="secondary"
              >
                <Button.Label>
                  Dismiss
                </Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ScreenWrapper>
  );
}