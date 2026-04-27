"use client";

import { useState } from "react";
import {
  Form,
  Button,
  Input,
  Select,
  SelectItem,
  NumberInput,
  DatePicker,
  useDisclosure,
} from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";
  
import PasswordChecklist from "./PasswordChecklist";
import OtpModal from "./OtpModal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

import { useOtpFlow } from "../hooks/useOtpFlow";
import { validateForm } from "../utils";
import { SignUpFormData } from "../types";

import { PROVINCES, GENDERS } from "@repo/constants";
import { sendEmailOtp } from "../../actions/send-otp";

export default function SignUpForm() {
  const { role, email } = useAuth();

  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const { isOpen: isErrorOpen, onOpenChange: onErrorOpenChange, onOpen: onErrorOpen } = useDisclosure();
  const { isOpen: isSuccessOpen, onOpenChange: onSuccessOpenChange, onOpen: onSuccessOpen } = useDisclosure();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<SignUpFormData>({
    email,
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    gender: "",
    mobileNumber: "",
    streetAddress: "",
    barangay: "",
    city: "",
    stateProvince: "",
    postalCode: undefined,
    password: "",
    confirmPassword: "",
  });

  const showError = (msg: string) => {
    setError(msg);
    onErrorOpen();
  };

  const handleChange = (field: keyof SignUpFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const otpFlow = useOtpFlow({ formData, role, showError, onSuccessOpen });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm(formData);
    if (validationError) {
      showError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await sendEmailOtp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      );
      if (result.error) {
        showError(result.error);
        return;
      }
      otpFlow.startCooldown();
      onOpen();
    } catch {
      showError("Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit} className="flex flex-col gap-5 my-10">
        {/* Personal Information */}
        <h2 className="text-2xl font-medium font-noto-serif mb-3">
          Personal Information
        </h2>

        <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            isRequired
            isReadOnly
            label="Email"
            placeholder="Enter your email"
            name="email"
            type="email"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2! bg-default-100",
            }}
            value={formData.email}
            onValueChange={handleChange("email")}
          />

          <Input
            isRequired
            label="First Name"
            placeholder="Enter your first name"
            name="firstName"
            type="text"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.firstName}
            onValueChange={handleChange("firstName")}
            isDisabled={loading}
          />

          <Input
            isRequired
            label="Last Name"
            placeholder="Enter your last name"
            name="lastName"
            type="text"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.lastName}
            onValueChange={handleChange("lastName")}
            isDisabled={loading}
          />

          <Input
            label="Middle Name"
            placeholder="Enter your middle name (optional)"
            name="middleName"
            type="text"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.middleName}
            onValueChange={handleChange("middleName")}
            isDisabled={loading}
          />

          <Select
            disableAnimation
            isRequired
            label="Gender"
            placeholder="Select your gender"
            name="gender"
            variant="bordered"
            classNames={{
              base: "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            selectedKeys={formData.gender ? [formData.gender] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              handleChange("gender")(selected ? String(selected) : "");
            }}
            isDisabled={loading}
          >
            {GENDERS.map((gender) => (
              <SelectItem key={gender} className="data-[hover=true]:bg-light-blue!">
                {gender}
              </SelectItem>
            ))}
          </Select>

          <Input
            isRequired
            label="Mobile Number"
            placeholder="Enter your mobile number"
            name="mobileNumber"
            type="tel"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.mobileNumber}
            onValueChange={handleChange("mobileNumber")}
            isDisabled={loading}
          />

          <DatePicker
            label="Birth Date"
            name="birth_date"
            variant="bordered"
            isRequired
            showMonthAndYearPickers
            onChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                birthDate: value ? String(value) : "",
              }));
              if (error) setError(null);
            }}
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            isDisabled={loading}
          />
        </div>

        {/* Address Information */}
        <h2 className="text-2xl font-medium font-noto-serif mb-3 mt-10">
          Address Information
        </h2>

        <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            isRequired
            label="Street Address"
            placeholder="Enter your street address"
            name="streetAddress"
            type="text"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.streetAddress}
            onValueChange={handleChange("streetAddress")}
            isDisabled={loading}
          />

          <Input
            isRequired
            label="Barangay"
            placeholder="Enter your barangay"
            name="barangay"
            type="text"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.barangay}
            onValueChange={handleChange("barangay")}
            isDisabled={loading}
          />

          <Input
            isRequired
            label="City"
            placeholder="Enter your city"
            name="city"
            type="text"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.city}
            onValueChange={handleChange("city")}
            isDisabled={loading}
          />

          <Select
            isRequired
            placeholder="Select your state/province"
            name="stateProvince"
            label="State/Province"
            variant="bordered"
            classNames={{
              trigger:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            className="w-full"
            selectedKeys={formData.stateProvince ? [formData.stateProvince] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              handleChange("stateProvince")(selected ? String(selected) : "");
            }}
            isDisabled={loading}
          >
            {PROVINCES.map((province) => (
              <SelectItem key={province} className="data-[hover=true]:bg-light-blue!">
                {province}
              </SelectItem>
            ))}
          </Select>

          <NumberInput
            isRequired
            label="Postal Code"
            placeholder="Enter your postal code"
            name="postalCode"
            variant="bordered"
            hideStepper
            maxValue={9999}
            minValue={1000}
            formatOptions={{ useGrouping: false }}
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.postalCode}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                postalCode: val === undefined ? undefined : Number(val),
              }))
            }
            isDisabled={loading}
          />
        </div>

        {/* Password */}
        <h2 className="text-2xl font-medium font-noto-serif mb-3 mt-10">
          Set Your Password
        </h2>

        <div className="w-full grid grid-cols-2 gap-5 md:grid-cols-2">
          <PasswordField
            isRequired
            label="Password"
            placeholder="Create a password"
            name="password"
            variant="bordered"
            value={formData.password}
            onChange={handleChange("password")}
          />

          <PasswordField
            isRequired
            label="Confirm Password"
            placeholder="Confirm your password"
            name="confirmPassword"
            variant="bordered"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
          />

          <PasswordChecklist
            password={formData.password}
            confirmPassword={formData.confirmPassword}
          />
        </div>

        <Button
          color="primary"
          className="w-full mt-5 md:max-w-[300px] md:self-end"
          size="lg"
          radius="full"
          type="submit"
          isLoading={loading}
          isDisabled={loading}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </Form>

      <OtpModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        email={formData.email}
        otp={otpFlow.otp}
        otpError={otpFlow.otpError}
        resendCooldown={otpFlow.resendCooldown}
        resendLoading={otpFlow.resendLoading}
        loading={otpFlow.loading}
        formatCooldown={otpFlow.formatCooldown}
        onOtpChange={(val) => { otpFlow.setOtp(val); otpFlow.setOtpError(null); }}
        onResend={otpFlow.handleResendOtp}
        onVerify={otpFlow.handleVerifyOtp}
        onCancel={otpFlow.handleCancelOtp}
      />

      <SuccessModal
        isOpen={isSuccessOpen}
        onOpenChange={onSuccessOpenChange}
        role={role}
      />

      <ErrorModal
        isOpen={isErrorOpen}
        onOpenChange={onErrorOpenChange}
        error={error}
      />
    </>
  );
}