import { View, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ApplicationHeader from "@/components/layout/ApplicationHeader";
import UploadFileField from "components/inputs/UploadFileField";

import {
  Input,
  Label,
  TextField,
  FieldError,
  Button,
  Separator,
} from "heroui-native";

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";

import { calcMoveInCost, formatPesoDisplay, handlePesoChange } from "@repo/utils";

type FieldErrors = {
  monthlyRent?: string;
  rentDueDay?: string;
  securityDeposit?: string;
  advanceRent?: string;
  leaseAgreement?: string;
};

function validate(values: {
  monthlyRent: string;
  rentDueDay: string;
  securityDeposit: string;
  advanceRent: string;
  leaseAgreement: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.monthlyRent.trim() || Number(values.monthlyRent) <= 0)
    errors.monthlyRent = "Monthly rent must be greater than 0.";

  const dueDay = Number(values.rentDueDay);
  if (!values.rentDueDay.trim() || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)
    errors.rentDueDay = "Enter a day between 1 and 31.";

  if (values.securityDeposit.trim() && Number(values.securityDeposit) <= 0)
    errors.securityDeposit = "Security deposit must be greater than 0.";

  if (values.advanceRent.trim() && Number(values.advanceRent) <= 0)
    errors.advanceRent = "Advance rent must be greater than 0.";

  if (!values.leaseAgreement)
    errors.leaseAgreement = "Please upload a lease agreement.";

  return errors;
}

export default function ThirdStep() {
  const router = useRouter();

  const [errors, setErrors] = useState<FieldErrors>({});

  const {
    monthlyRent,
    rentDueDay,
    securityDeposit,
    advanceRent,
    leaseAgreement,
    setField,
  } = useApartmentFormStore();

  function clearError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleNext() {
    const validationErrors = validate({
      monthlyRent,
      rentDueDay,
      securityDeposit,
      advanceRent,
      leaseAgreement,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    router.push("/landlord/manage-apartment/add-apartment/fourth-step");
  }

  const totalMoveInCost = calcMoveInCost(monthlyRent, securityDeposit, advanceRent);

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle="Pricing & Terms"
        nextTitle="Description & Amenities"
        step={3}
        totalSteps={5}
      />

      <View className="p-5 flex-1">
        <View className="flex gap-3">
          <TextField isRequired isInvalid={!!errors.monthlyRent}>
            <Label>Monthly Rent:</Label>
            <Input
              placeholder="Enter monthly rent"
              value={formatPesoDisplay(monthlyRent)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const { raw } = handlePesoChange(text);
                setField("monthlyRent", raw);
                clearError("monthlyRent");
              }}
            />
            {errors.monthlyRent && <FieldError>{errors.monthlyRent}</FieldError>}
          </TextField>

          <TextField isRequired isInvalid={!!errors.rentDueDay}>
            <Label>Rent Due Day:</Label>
            <Input
              placeholder="Day of the month rent is due"
              value={rentDueDay}
              keyboardType="numeric"
              onChangeText={(text) => {
                setField("rentDueDay", text.replace(/[^0-9]/g, ""));
                clearError("rentDueDay");
              }}
            />
            {errors.rentDueDay && <FieldError>{errors.rentDueDay}</FieldError>}
          </TextField>

          <TextField isInvalid={!!errors.securityDeposit}>
            <Label>Security Deposit:</Label>
            <Input
              placeholder="Enter security deposit"
              value={formatPesoDisplay(securityDeposit)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const { raw } = handlePesoChange(text);
                setField("securityDeposit", raw);
                clearError("securityDeposit");
              }}
            />
            {errors.securityDeposit && <FieldError>{errors.securityDeposit}</FieldError>}
          </TextField>

          <TextField isInvalid={!!errors.advanceRent}>
            <Label>Advance Rent:</Label>
            <Input
              placeholder="Enter advance rent"
              value={formatPesoDisplay(advanceRent)}
              keyboardType="numeric"
              onChangeText={(text) => {
                const { raw } = handlePesoChange(text);
                setField("advanceRent", raw);
                clearError("advanceRent");
              }}
            />
            {errors.advanceRent && <FieldError>{errors.advanceRent}</FieldError>}
          </TextField>

          {/* Total Move-in Cost */}
          {!!monthlyRent && (
            <View className="flex gap-1 bg-surface rounded-xl border border-border  px-4 py-3">
              {/* Monthly Rent */}
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-inter text-foreground">
                  Monthly Rent:
                </Text>
                <Text className="text-base font-inter text-foreground">
                  {formatPesoDisplay(monthlyRent) || "₱ 0"}
                </Text>
              </View>

              {/* Security Deposit */}
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-inter text-foreground">
                  Security Deposit:
                </Text>
                <Text className="text-base font-inter text-foreground">
                  {formatPesoDisplay(securityDeposit) || "₱ 0"}
                </Text>
              </View>

              {/* Advance Rent */}
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-inter text-foreground">
                  Advance Rent:
                </Text>
                <Text className="text-base font-inter text-foreground">
                  {formatPesoDisplay(advanceRent) || "₱ 0"}
                </Text>
              </View>

              <Separator className="my-4" />

              {/* Total Move-in Cost */}
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-nunitoSemiBold text-foreground">
                  Total Move-in Cost:
                </Text>
                <Text className="text-base font-nunitoSemiBold text-accent">
                  {formatPesoDisplay(totalMoveInCost.toString())}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Separator className="my-4" />

        <UploadFileField
          label="Lease Agreement:"
          placeholder="No lease agreement uploaded yet."
          required
          value={leaseAgreement
            ? {
              uri: leaseAgreement,
              name: 'lease_agreement',
              mimeType: 'application/pdf',
              size: 0,
              lastModified: 0
            } : null}
          error={errors.leaseAgreement}
          onChange={(asset) => {
            setField("leaseAgreement", asset?.uri ?? '');
            clearError("leaseAgreement");
          }}
        />

        {/* Back or Next Button */}
        <View className="flex-row mt-10 gap-4">
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>Back</Button.Label>
          </Button>

          <Button onPress={handleNext} className="flex-1">
            <Button.Label>Next</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
