import { View, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ApplicationHeader from "@/components/layout/ApplicationHeader";
import {
  ADD_APARTMENT_STEP_HREFS,
  ADD_APARTMENT_STEP_LABELS,
  ADD_APARTMENT_TOTAL_STEPS,
} from "constants/addApartmentSteps";
import UploadFileField from "components/inputs/UploadFileField";
import DropdownField from "components/inputs/DropdownField";

import {
  Input,
  Label,
  TextField,
  FieldError,
  Button,
  Separator,
} from "heroui-native";

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";

import {
  ADVANCE_RENT_MONTH_OPTIONS,
  SECURITY_DEPOSIT_MONTH_OPTIONS,
  calcMoveInCost,
  formatPesoDisplay,
  formatPricingMonths,
  handlePesoChange,
  pricingAmountFromMonths,
  validateApartmentPricing,
} from "@repo/utils";

type FieldErrors = {
  monthlyRent?: string;
  rentDueDay?: string;
  securityDepositMonths?: string;
  advanceRentMonths?: string;
  leaseAgreement?: string;
};

function validate(values: {
  monthlyRent: string;
  rentDueDay: string;
  securityDepositMonths: number;
  advanceRentMonths: number;
  leaseAgreement: string;
}): FieldErrors {
  const errors: FieldErrors = validateApartmentPricing({
    monthlyRent: values.monthlyRent.trim() ? Number(values.monthlyRent) : Number.NaN,
    securityDepositMonths: values.securityDepositMonths,
    advanceRentMonths: values.advanceRentMonths,
    rentDueDay: values.rentDueDay.trim() ? Number(values.rentDueDay) : null,
  });

  if (!values.leaseAgreement)
    errors.leaseAgreement = "Please upload a lease agreement.";

  return errors;
}

/** Month options shown as "None", "1 month", "2 months". */
function monthLabels(options: readonly number[]): string[] {
  return options.map(formatPricingMonths);
}

function monthsFromLabel(options: readonly number[], label: string | null): number {
  return options.find((months) => formatPricingMonths(months) === label) ?? 0;
}

export default function ThirdStep() {
  const router = useRouter();

  const [errors, setErrors] = useState<FieldErrors>({});

  const {
    monthlyRent,
    rentDueDay,
    securityDepositMonths,
    advanceRentMonths,
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
      securityDepositMonths,
      advanceRentMonths,
      leaseAgreement,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    router.push("/landlord/manage-apartment/add-apartment/fourth-step");
  }

  const rentAmount = Number(monthlyRent) || 0;
  const securityDeposit = pricingAmountFromMonths(rentAmount, securityDepositMonths);
  const advanceRent = pricingAmountFromMonths(rentAmount, advanceRentMonths);
  const totalMoveInCost = calcMoveInCost(monthlyRent, securityDeposit, advanceRent);

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle="Pricing & Terms"
        nextTitle="Description & Amenities"
        step={3}
        totalSteps={ADD_APARTMENT_TOTAL_STEPS}
        stepLabels={ADD_APARTMENT_STEP_LABELS}
        stepHrefs={ADD_APARTMENT_STEP_HREFS}
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

          <DropdownField
            label="Security Deposit:"
            bottomSheetLabel="Security Deposit"
            options={monthLabels(SECURITY_DEPOSIT_MONTH_OPTIONS)}
            value={formatPricingMonths(securityDepositMonths)}
            onSelect={(label) => {
              setField("securityDepositMonths", monthsFromLabel(SECURITY_DEPOSIT_MONTH_OPTIONS, label));
              clearError("securityDepositMonths");
            }}
            error={errors.securityDepositMonths}
          />

          <DropdownField
            label="Advance Rent:"
            bottomSheetLabel="Advance Rent"
            options={monthLabels(ADVANCE_RENT_MONTH_OPTIONS)}
            value={formatPricingMonths(advanceRentMonths)}
            onSelect={(label) => {
              setField("advanceRentMonths", monthsFromLabel(ADVANCE_RENT_MONTH_OPTIONS, label));
              clearError("advanceRentMonths");
            }}
            error={errors.advanceRentMonths}
          />

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
