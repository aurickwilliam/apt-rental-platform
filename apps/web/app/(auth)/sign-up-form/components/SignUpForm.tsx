"use client";

import { useState, useEffect, useRef } from "react";

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
  DatePicker,
} from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";

import { PROVINCES, GENDERS } from "@repo/constants";

import { Minus, CircleCheck, CircleX, CircleAlert, Mail } from "lucide-react";

import { createClient } from "@repo/supabase/browser";

import { signUp } from "../../actions/sign-up";
import { sendEmailOtp } from "../../actions/send-otp";

const OTP_COOLDOWN = 120;

interface SignUpFormData {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
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

  // For OTP modal
  const { 
    isOpen, 
    onOpenChange, 
    onOpen, 
  } = useDisclosure();

  // For error modal
  const {
    isOpen: isErrorOpen,
    onOpenChange: onErrorOpenChange,
    onOpen: onErrorOpen,
  } = useDisclosure();

  // For success modal
  const {
    isOpen: isSuccessOpen,
    onOpenChange: onSuccessOpenChange,
    onOpen: onSuccessOpen,
  } = useDisclosure();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<SignUpFormData>({
    email: email,
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

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setResendCooldown(OTP_COOLDOWN);

    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Updates form data and clears error when user types
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
      startCooldown();
      onOpen();
    } catch {
      showError("Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError(null);
    try {
      const result = await sendEmailOtp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      );
      if (result.error) {
        setOtpError(result.error);
        return;
      }
      setOtp("");
      startCooldown();
    } catch {
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (onClose: () => void) => {
    setLoading(true);
    setOtpError(null);

    try {
      const supabase = createClient();
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: "signup",
      });

      if (otpError || !data.user) {
        setOtpError("Invalid or expired code. Please try again.");
        return;
      }

      const fd = new FormData();
      fd.set("userId", data.user.id);
      fd.set("email", formData.email);
      fd.set("firstName", formData.firstName);
      fd.set("lastName", formData.lastName);
      fd.set("middleName", formData.middleName);
      fd.set("birthDate", formData.birthDate);
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
        onClose();
        onSuccessOpen(); // ← open success modal instead of replacing page
      }
    } catch (err) {
      console.error("Caught error:", err);
      setOtpError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOtp = async (onClose: () => void) => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOtp("");
    setOtpError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(0);
    onClose();
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
              <SelectItem
                key={gender}
                className="data-[hover=true]:bg-light-blue!"
              >
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
                    setOtpError(null);
                  }}
                  autoFocus
                />

                {otpError && (
                  <p className="text-sm text-danger text-center">{otpError}</p>
                )}

                {/* Resend row */}
                <div className="flex items-center gap-2 text-sm text-default-500">
                  <span>Didn&apos;t receive a code?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-medium text-default-400">
                      Resend in {formatCooldown(resendCooldown)}
                    </span>
                  ) : (
                    <Button
                      variant="light"
                      size="sm"
                      color="primary"
                      isLoading={resendLoading}
                      isDisabled={resendLoading}
                      onPress={handleResendOtp}
                      className="p-0 h-auto min-w-0 font-medium"
                    >
                      Resend Code
                    </Button>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                <Button
                  color="primary"
                  radius="full"
                  size="lg"
                  className="w-full"
                  isDisabled={otp.length < 6 || loading}
                  isLoading={loading}
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

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessOpen}
        onOpenChange={onSuccessOpenChange}
        placement="center"
        backdrop="blur"
        isDismissable={false}
        isKeyboardDismissDisabled
        hideCloseButton
      >
        <ModalContent>
          {() => (
            <>
              <ModalBody className="flex flex-col items-center gap-4 py-8">
                <div className="rounded-full bg-green-100 p-4">
                  <CircleCheck size={48} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold font-noto-serif text-center">
                  Account Created!
                </h2>
                <p className="text-default-500 text-center text-sm max-w-xs">
                  Your account has been created successfully. You can now sign
                  in with your email and password.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  radius="full"
                  size="lg"
                  className="w-full"
                  as="a"
                  href={
                    role === "tenant" ? "/tenant/my-rental" : "/landlord/dashboard"
                  }
                >
                  Continue to {role === "tenant" ? "My Rental" : "Dashboard"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Error Modal */}
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