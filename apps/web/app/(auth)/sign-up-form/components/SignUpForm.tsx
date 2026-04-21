"use client";

import { useState } from "react";

import {
  Form,
  Button,
  Input,
  Select,
  SelectItem,
  NumberInput,
  InputOtp,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";

import { PROVINCES } from "@repo/constants";

import { Minus, CircleCheck, CircleX, CircleAlert, Mail } from "lucide-react";

import { createClient } from "@repo/supabase/browser";

import { signUp } from "../../actions/sign-up";
import { sendEmailOtp } from "../../actions/send-otp";

interface SignUpFormData {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  age: number | undefined;
  gender: string;
  mobileNumber: string;
  streetAddress: string;
  barangay: string;
  city: string;
  stateProvince: string;
  postalCode: number | undefined;
  password: string;
  confirmPassword: string;
}

export default function SignUpForm() {
  const { role, email } = useAuth();

  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const {
    isOpen: isErrorOpen,
    onOpenChange: onErrorOpenChange,
    onOpen: onErrorOpen,
  } = useDisclosure();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<SignUpFormData>({
    email: email,
    firstName: "",
    lastName: "",
    middleName: "",
    age: undefined,
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

  const handleChange = (field: keyof SignUpFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const showError = (msg: string) => {
    setError(msg);
    onErrorOpen();
  };

  // Password validation checks
  const hasMinLength = formData.password.length >= 8;
  const hasUpperAndLower =
    /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(formData.password);
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  const getCheckIcon = (isValid: boolean) => {
    if (formData.password.length === 0)
      return <Minus size={24} className="text-gray-400" />;
    return isValid ? (
      <CircleCheck size={24} className="text-green-500" />
    ) : (
      <CircleX size={24} className="text-red-500" />
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
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
      onOpen();
    } catch {
      showError("Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (onClose: () => void) => {
    setLoading(true);
    setOtpError(null);

    try {
      const supabase = createClient(); // client-side client
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: "signup",
      });

      if (otpError || !data.user) {
        setOtpError("Invalid or expired code. Please try again.");
        return;
      }

      // Build FormData to pass to the server action
      const fd = new FormData();
      fd.set("userId", data.user.id);
      fd.set("email", formData.email);
      fd.set("firstName", formData.firstName);
      fd.set("lastName", formData.lastName);
      fd.set("middleName", formData.middleName);
      fd.set("age", formData.age?.toString() ?? "");
      fd.set("gender", formData.gender);
      fd.set("mobileNumber", formData.mobileNumber);
      fd.set("streetAddress", formData.streetAddress);
      fd.set("barangay", formData.barangay);
      fd.set("city", formData.city);
      fd.set("stateProvince", formData.stateProvince);
      fd.set("postalCode", formData.postalCode?.toString() ?? "");
      fd.set("password", formData.password);
      fd.set("confirmPassword", formData.confirmPassword);
      fd.set("role", role);

      const result = await signUp({ error: null, success: false }, fd);

      if (result.error) {
        showError(result.error);
        onClose();
      } else if (result.success) {
        setSuccess(true);
        onClose();
      }
    } catch (err) {
      console.error("Caught error:", err);
      setOtpError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clean up the pending auth user when user cancels
  const handleCancelOtp = async (onClose: () => void) => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOtp("");
    setOtpError(null);
    onClose();
  };

  // Gender Options
  const GENDER_OPTIONS = ["Male", "Female", "Others"];

  // If sign-up succeeded, show a success message
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 my-20 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <CircleCheck size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold font-noto-serif">
          Account Created!
        </h2>
        <p className="text-default-500 max-w-md">
          Your account has been created successfully. You can now sign in with
          your email and password.
        </p>
        <Button
          color="primary"
          radius="full"
          size="lg"
          className="mt-4"
          as="a"
          href={role === "tenant" ? "/tenant/my-rental" : "/landlord/dashboard"}
        >
          Continue to {role === "tenant" ? "My Rental" : "Dashboard"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Form onSubmit={handleSubmit} className="flex flex-col gap-5 my-10">
        {/* Personal Information */}
        <h2 className="text-2xl font-medium font-noto-serif mb-3">
          Personal Information
        </h2>

        <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Email Address */}
          <Input
            isRequired
            label="Email"
            size="lg"
            placeholder="Enter your email"
            labelPlacement="outside"
            name="email"
            type="email"
            variant="bordered"
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.email}
            onValueChange={handleChange("email")}
          />

          {/* First Name*/}
          <Input
            isRequired
            label="First Name"
            size="lg"
            placeholder="Enter your first name"
            labelPlacement="outside"
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

          {/* Last Name */}
          <Input
            isRequired
            label="Last Name"
            size="lg"
            placeholder="Enter your last name"
            labelPlacement="outside"
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

          {/* Middle Name */}
          <Input
            label="Middle Name"
            size="lg"
            placeholder="Enter your middle name (optional)"
            labelPlacement="outside"
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

          {/* Age */}
          <NumberInput
            isRequired
            label="Age"
            size="lg"
            placeholder="Enter your age"
            labelPlacement="outside"
            name="age"
            variant="bordered"
            hideStepper
            minValue={0}
            maxValue={120}
            classNames={{
              inputWrapper:
                "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
            }}
            value={formData.age}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                age: val === undefined ? undefined : Number(val),
              }))
            }
            isDisabled={loading}
          />

          {/* Gender */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-base">
              Gender <span className="text-danger">*</span>
            </label>

            <Select
              disableAnimation
              isRequired
              size="lg"
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
              {GENDER_OPTIONS.map((gender) => (
                <SelectItem
                  key={gender}
                  className="data-[hover=true]:bg-light-blue!"
                >
                  {gender}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Mobile Number */}
          <Input
            isRequired
            label="Mobile Number"
            size="lg"
            placeholder="Enter your mobile number"
            labelPlacement="outside"
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
        </div>

        {/* Address Information */}
        <h2 className="text-2xl font-medium font-noto-serif mb-3 mt-10">
          Address Information
        </h2>

        <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Street Address */}
          <Input
            isRequired
            label="Street Address"
            size="lg"
            placeholder="Enter your street address"
            labelPlacement="outside"
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

          {/* Barangay */}
          <Input
            isRequired
            label="Barangay"
            size="lg"
            placeholder="Enter your barangay"
            labelPlacement="outside"
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

          {/* City */}
          <Input
            isRequired
            label="City"
            size="lg"
            placeholder="Enter your city"
            labelPlacement="outside"
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

          {/* State/Province */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-base">
              State/Province <span className="text-danger">*</span>
            </label>
            <Select
              isRequired
              placeholder="Select your state/province"
              name="stateProvince"
              variant="bordered"
              size="lg"
              classNames={{
                trigger:
                  "data-[focus=true]:border-primary! data-[focus=true]:border-2!",
              }}
              className="w-full"
              selectedKeys={
                formData.stateProvince ? [formData.stateProvince] : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                handleChange("stateProvince")(selected ? String(selected) : "");
              }}
              isDisabled={loading}
            >
              {PROVINCES.map((province) => (
                <SelectItem
                  key={province}
                  className="data-[hover=true]:bg-light-blue!"
                >
                  {province}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Postal Code */}
          <NumberInput
            isRequired
            label="Postal Code"
            size="lg"
            placeholder="Enter your postal code"
            labelPlacement="outside"
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
            size="lg"
            placeholder="Create a password"
            labelPlacement="outside"
            name="password"
            variant="bordered"
            value={formData.password}
            onChange={handleChange("password")}
          />

          <PasswordField
            isRequired
            label="Confirm Password"
            size="lg"
            placeholder="Confirm your password"
            labelPlacement="outside"
            name="confirmPassword"
            variant="bordered"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
          />

          {/* Requirements Password */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {getCheckIcon(hasMinLength)}
              <p className="text-sm text-gray-600">At least 8 characters</p>
            </div>

            <div className="flex items-center gap-2">
              {getCheckIcon(hasUpperAndLower)}
              <p className="text-sm text-gray-600">
                Contains uppercase and lowercase letters
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getCheckIcon(hasNumber)}
              <p className="text-sm text-gray-600">
                Includes at least one number
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getCheckIcon(hasSpecialChar)}
              <p className="text-sm text-gray-600">
                Contains at least one special character
              </p>
            </div>

            <div className="flex items-center gap-2">
              {formData.confirmPassword.length === 0 ? (
                <Minus size={24} className="text-gray-400" />
              ) : passwordsMatch ? (
                <CircleCheck size={24} className="text-green-500" />
              ) : (
                <CircleX size={24} className="text-red-500" />
              )}
              <p className="text-sm text-gray-600">Passwords match</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
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

      {/* OTP Verification Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        isDismissable={false}
        isKeyboardDismissDisabled
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Verify Your Email Address
              </ModalHeader>
              <ModalBody className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Mail size={32} className="text-primary" />
                </div>
                <p className="text-center text-sm text-default-500">
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-foreground">
                    {formData.email}
                  </span>
                  .
                </p>
                <InputOtp
                  length={6}
                  size="lg"
                  variant="bordered"
                  color="primary"
                  value={otp}
                  onValueChange={(val) => {
                    setOtp(val);
                    setOtpError(null); // clear error when user types
                  }}
                  autoFocus
                />

                {otpError && (
                  <p className="text-sm text-danger text-center">{otpError}</p>
                )}
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                <Button
                  color="primary"
                  radius="full"
                  size="lg"
                  className="w-full"
                  isDisabled={otp.length < 6 || loading}
                  onPress={() => handleVerifyOtp(onClose)}
                >
                  Verify &amp; Create Account
                </Button>
                <Button
                  variant="light"
                  radius="full"
                  size="lg"
                  className="w-full"
                  isDisabled={loading}
                  onPress={() => handleCancelOtp(onClose)}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Error Message */}
      <Modal
        isOpen={isErrorOpen}
        onOpenChange={onErrorOpenChange}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Something went wrong
              </ModalHeader>
              <ModalBody className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-full bg-danger-100 p-3">
                  <CircleAlert size={32} className="text-danger" />
                </div>
                <p className="text-center text-sm text-default-500">{error}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  radius="full"
                  size="lg"
                  className="w-full"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
