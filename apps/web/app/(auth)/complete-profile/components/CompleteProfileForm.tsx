"use client";

import {
  Input,
  Select,
  SelectItem,
  Button,
  Divider,
  NumberInput,
  DatePicker,
} from "@heroui/react";
import { useActionState } from "react";

import { completeProfile } from "../../actions/complete-profile";
import { GENDERS, PROVINCES } from "@repo/constants";

type Props = {
  email: string;
  firstName: string;
  lastName: string;
  role: "tenant" | "landlord";
};

export default function CompleteProfileForm({
  email,
  firstName,
  lastName,
  role,
}: Props) {
  const [state, action, isPending] = useActionState(
    completeProfile,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="role" value={role} />

      {/* Personal Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Email"
            name="email"
            defaultValue={email}
            isReadOnly
            variant="bordered"
            classNames={{
              inputWrapper: "bg-default-100",
            }}
          />

          <Input
            label="First Name"
            name="first_name"
            placeholder="Enter your first name"
            defaultValue={firstName}
            variant="bordered"
            isRequired
          />

          <Input
            label="Last Name"
            name="last_name"
            placeholder="Enter your last name"
            defaultValue={lastName}
            variant="bordered"
            isRequired
          />

          <Input
            label="Middle Name"
            name="middle_name"
            placeholder="Enter your middle name (optional)"
            variant="bordered"
          />

          <Select
            label="Gender"
            name="gender"
            placeholder="Select your gender"
            variant="bordered"
            isRequired
          >
            {GENDERS.map((gender) => (
              <SelectItem key={gender}>
                {gender}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Mobile Number"
            name="mobile_number"
            placeholder="Enter your mobile number"
            variant="bordered"
            type="tel"
            isRequired
          />

          <DatePicker
            label="Birth Date"
            name="birth_date"
            variant="bordered"
            showMonthAndYearPickers
            isRequired
          />
        </div>
      </section>

      <Divider />

      {/* Address Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif">
          Address Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Street Address"
            name="street_address"
            placeholder="Enter your street address"
            variant="bordered"
            isRequired
          />

          <Input
            label="Barangay"
            name="barangay"
            placeholder="Enter your barangay"
            variant="bordered"
            isRequired
          />

          <Input
            label="City"
            name="city"
            placeholder="Enter your city"
            variant="bordered"
            isRequired
          />

          <Select
            label="Province"
            name="province"
            placeholder="Select your province"
            variant="bordered"
            isRequired
          >
            {PROVINCES.map((province) => (
              <SelectItem key={province}>
                {province}
              </SelectItem>
            ))}
          </Select>

          <NumberInput
            label="Postal Code"
            name="postal_code"
            placeholder="Enter your postal code"
            variant="bordered"
            hideStepper
            formatOptions={{
              useGrouping: false,
            }}
          />
        </div>
      </section>

      {state?.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">
            {state.error}
          </p>
        </div>
      )}

      <Button
        type="submit"
        color="primary"
        size="lg"
        radius="full"
        className="w-full font-semibold"
        isLoading={isPending}
      >
        Complete Profile
      </Button>
    </form>
  );
}