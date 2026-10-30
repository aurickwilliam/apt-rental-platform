import { View, Text } from "react-native";

import { PH_MOBILE_MAX_INPUT_LENGTH, PROVINCES, GENDERS, SUFFIXES } from "@repo/constants";
import { fromBirthDateValue, toBirthDateValue } from "@repo/utils";

import { Input, Label, TextField, FieldError, Separator } from "heroui-native";

import DateField from "@/components/inputs/DateField";
import DropdownField from "@/components/inputs/DropdownField";
import type { ProfileDetailsForm } from "@/hooks/auth/useProfileDetailsForm";

interface ProfileDetailsFieldsProps {
  form: ProfileDetailsForm;
  email: string;
}

// The read-only email, personal information and address sections shared by
// the sign-up and finish-profile screens. Render it inside the screen's
// `flex gap-4` column; the form state and validation come from
// useProfileDetailsForm.
export default function ProfileDetailsFields({ form, email }: ProfileDetailsFieldsProps) {
  const { values, getError } = form;

  return (
    <>
      <TextField isDisabled>
        <Label>Email Address:</Label>
        <Input value={email} />
      </TextField>

      <Separator />

      <Text className="text-xl text-foreground font-nunitoBold mt-3">
        Personal Information
      </Text>

      <View {...form.trackPosition("firstName")}>
        <TextField isRequired isInvalid={!!getError("firstName")}>
          <Label>First Name:</Label>
          <Input
            placeholder="Enter your first name"
            value={values.firstName}
            onChangeText={(value) => form.setField("firstName", value)}
          />
          {getError("firstName") && <FieldError>{getError("firstName")}</FieldError>}
        </TextField>
      </View>

      <View {...form.trackPosition("lastName")}>
        <TextField isRequired isInvalid={!!getError("lastName")}>
          <Label>Last Name:</Label>
          <Input
            placeholder="Enter your last name"
            value={values.lastName}
            onChangeText={(value) => form.setField("lastName", value)}
          />
          {getError("lastName") && <FieldError>{getError("lastName")}</FieldError>}
        </TextField>
      </View>

      <TextField>
        <Label>Middle Name:</Label>
        <Input
          placeholder="Enter your middle name"
          value={values.middleName}
          onChangeText={(value) => form.setField("middleName", value)}
        />
      </TextField>

      <DropdownField
        label="Suffix Name:"
        bottomSheetLabel="Select your suffix name"
        placeholder="No suffix"
        options={SUFFIXES}
        value={values.suffixName}
        onSelect={(value) => form.setField("suffixName", value)}
      />

      <View {...form.trackPosition("gender")}>
        <DropdownField
          label="Gender:"
          bottomSheetLabel="Select your gender"
          placeholder="Select your gender"
          options={GENDERS}
          value={values.gender}
          onSelect={(value) => form.setField("gender", value)}
          required
          error={getError("gender")}
        />
      </View>

      <View {...form.trackPosition("birthDate")}>
        <DateField
          label="Date of Birth:"
          placeholder="Select your date of birth"
          required
          value={fromBirthDateValue(values.birthDate)}
          onChange={(date) => form.setField("birthDate", toBirthDateValue(date))}
          error={getError("birthDate")}
        />
      </View>

      <View {...form.trackPosition("mobileNumber")}>
        <TextField isRequired isInvalid={!!form.mobile.errorMessage}>
          <Label>Mobile Number:</Label>
          <Input
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            maxLength={PH_MOBILE_MAX_INPUT_LENGTH}
            value={form.mobile.value}
            onChangeText={form.mobile.onChange}
          />
          {form.mobile.errorMessage && <FieldError>{form.mobile.errorMessage}</FieldError>}
        </TextField>
      </View>

      <Separator />

      <Text className="text-xl text-foreground font-nunitoBold mt-3">
        Address Information
      </Text>

      <View {...form.trackPosition("province")}>
        <DropdownField
          label="Province:"
          bottomSheetLabel="Select your province"
          placeholder="Select your province"
          options={PROVINCES}
          value={values.province}
          onSelect={form.setProvince}
          enableSearch
          searchPlaceholder="Search provinces..."
          required
          error={getError("province")}
        />
      </View>

      <View {...form.trackPosition("city")}>
        <DropdownField
          label="City:"
          bottomSheetLabel="Select your city"
          placeholder="Select your city"
          options={form.cityOptions}
          value={values.city}
          onSelect={form.setCity}
          required
          error={getError("city")}
          enableSearch
          searchPlaceholder="Search cities..."
          disabled={!values.province}
        />
      </View>

      <View {...form.trackPosition("barangay")}>
        <DropdownField
          label="Barangay:"
          bottomSheetLabel="Select your barangay"
          placeholder="Select your barangay"
          options={form.barangayOptions}
          value={values.barangay}
          onSelect={(value) => form.setField("barangay", value)}
          required
          error={getError("barangay")}
          enableSearch
          searchPlaceholder="Search barangays..."
          disabled={!values.city}
        />
      </View>

      <View {...form.trackPosition("streetAddress")}>
        <TextField isRequired isInvalid={!!getError("streetAddress")}>
          <Label>Street Address:</Label>
          <Input
            className="shadow-none"
            placeholder="Enter your street address"
            value={values.streetAddress}
            onChangeText={(value) => form.setField("streetAddress", value)}
          />
          {getError("streetAddress") && <FieldError>{getError("streetAddress")}</FieldError>}
        </TextField>
      </View>

      <View {...form.trackPosition("postalCode")}>
        <TextField isRequired isInvalid={!!form.postal.error}>
          <Label>Postal Code:</Label>
          <Input
            placeholder="Enter your postal code"
            keyboardType="numeric"
            maxLength={4}
            value={form.postal.value}
            onChangeText={form.postal.onChange}
            onBlur={form.postal.onBlur}
          />
          {form.postal.error && <FieldError>{form.postal.error}</FieldError>}
          {!form.postal.error && form.postal.warning && (
            <Text className="text-xs text-warning-text">{form.postal.warning}</Text>
          )}
        </TextField>
      </View>
    </>
  );
}
