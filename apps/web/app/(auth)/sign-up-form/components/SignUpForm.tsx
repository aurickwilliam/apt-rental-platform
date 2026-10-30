"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Form,
  Button,
  Input,
  Select,
  useOverlayState,
  TextField, 
  Label,
  ListBox,
} from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";

import PasswordRequirementList from "@/app/components/inputs/PasswordRequirementList";
import OtpModal from "./OtpModal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

import { useOtpFlow } from "../hooks/useOtpFlow";
import { validateSignUpForm } from "../utils";
import { SignUpFormData } from "../types";
import RegistrationAddressFields from "../../components/RegistrationAddressFields";
import RegistrationBirthDateField from "../../components/RegistrationBirthDateField";
import RegistrationPolicyAcceptance from "../../components/RegistrationPolicyAcceptance";
import { emptyRegistrationAcceptance, validateRegistrationAcceptance, type AcceptanceErrors } from "@/lib/registration-policies";
import { validateRegistrationAddress, type RegistrationAddress } from "@/lib/registration-address";

import {
  GENDERS,
  SUFFIXES,
  getPasswordRequirements,
  sanitizePHMobileInput,
} from "@repo/constants";
import { sendEmailOtp } from "../../actions/send-otp";

// Selected option: soft blue surface with a primary-blue check.
const OPTION_CLASS =
  "data-[hovered=true]:bg-light-blue! data-[selected=true]:bg-primary/10! data-[selected=true]:text-primary";

const NO_SUFFIX = "none";

export default function SignUpForm() {
  const { role, email } = useAuth();

  const { isOpen, open: onOpen, close: onClose } = useOverlayState();
  const { isOpen: isErrorOpen, open: onErrorOpen, close: onErrorClose } = useOverlayState();
  const { isOpen: isSuccessOpen, open: onSuccessOpen, close: onSuccessClose } = useOverlayState();

  // Adapter for child modals that still use onOpenChange pattern
  const onOpenChange = (val: boolean) => (val ? onOpen() : onClose());
  const onErrorOpenChange = (val: boolean) => (val ? onErrorOpen() : onErrorClose());
  const onSuccessOpenChange = (val: boolean) => (val ? onSuccessOpen() : onSuccessClose());

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const [birthDateError, setBirthDateError] = useState<{ message: string; value: string } | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [acceptance, setAcceptance] = useState(emptyRegistrationAcceptance);
  const [acceptanceErrors, setAcceptanceErrors] = useState<AcceptanceErrors>({});
  const birthDateRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<SignUpFormData>({
    email,
    firstName: "",
    lastName: "",
    middleName: "",
    suffix: "",
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

  const address: RegistrationAddress = {
    province: formData.stateProvince, city: formData.city, barangay: formData.barangay,
    streetAddress: formData.streetAddress, postalCode: formData.postalCode === undefined ? "" : String(formData.postalCode),
  };
  const addressErrors = validateRegistrationAddress(address);

  const showBirthDateError = (message: string, value: string, verified = false) => {
    setBirthDateError({ message, value });
    if (verified) setEmailVerified(true);
    onClose();
    requestAnimationFrame(() => birthDateRef.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus());
  };
  const showAcceptanceErrors = (errors: AcceptanceErrors, verified = false) => {
    if (verified) setEmailVerified(true);
    setAcceptanceErrors(errors);
    setAcceptance(previous => ({ ...previous, privacyAccepted: false, termsAccepted: false }));
    onClose();
  };
  const otpFlow = useOtpFlow({ formData, role, acceptance, showError, onSuccessOpen, onBirthDateError: showBirthDateError, onAcceptanceError: showAcceptanceErrors });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setAddressSubmitted(true);
    const validationError = validateSignUpForm(formData);
    const birthError = validationError?.field === "birthDate" ? validationError.message : null;
    setBirthDateError(birthError ? { message: birthError, value: formData.birthDate } : null);
    if (birthError) birthDateRef.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
    if (birthError || Object.keys(addressErrors).length) return;

    if (validationError) {
      showError(validationError.message);
      return;
    }

    const policyErrors = validateRegistrationAcceptance(acceptance);
    setAcceptanceErrors(policyErrors);
    if (Object.keys(policyErrors).length) return;
    if (loading || otpFlow.loading || isOpen) return;

    setLoading(true);
    try {
      const result = await sendEmailOtp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.birthDate,
        acceptance,
      );
      if (result.acceptanceErrors) {
        showAcceptanceErrors(result.acceptanceErrors);
        return;
      }
      if (result.birthDateError) {
        showBirthDateError(result.birthDateError, result.birthDate ?? formData.birthDate);
        return;
      }
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
      <Form onSubmit={handleSubmit} className="flex flex-col gap-[clamp(1.25rem,3vh,1.25rem)] my-[clamp(2rem,5vh,2.5rem)]">
        {/* Personal Information */}
        <h2 className="text-2xl font-bold font-nunito mb-3 text-foreground">
          Personal Information
        </h2>

        <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField
            isRequired
            isReadOnly
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
          >
            <Label>Email</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your email" />
          </TextField>

          <TextField
            isRequired
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange("firstName")}
            isDisabled={loading}
          >
            <Label>First Name</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your first name" />
          </TextField>

          <TextField
            isRequired
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            isDisabled={loading}
          >
            <Label>Last Name</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your last name" />
          </TextField>

          <TextField
            name="middleName"
            type="text"
            value={formData.middleName}
            onChange={handleChange("middleName")}
            isDisabled={loading}
          >
            <Label>Middle Name</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your middle name (optional)" />
          </TextField>

          <Select
            name="suffix"
            placeholder="No suffix"
            value={formData.suffix || null}
            onChange={(key) => handleChange("suffix")(key && key !== NO_SUFFIX ? String(key) : "")}
            isDisabled={loading}
          >
            <Label>Suffix</Label>
            <Select.Trigger className="bg-card! text-foreground!">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[NO_SUFFIX, ...SUFFIXES].map((option) => (
                  <ListBox.Item
                    key={option}
                    id={option}
                    textValue={option === NO_SUFFIX ? "No suffix" : option}
                    className={OPTION_CLASS}
                  >
                    {option === NO_SUFFIX ? "No suffix" : option}
                    <ListBox.ItemIndicator className="text-primary" />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            isRequired
            name="gender"
            placeholder="Select your gender"
            value={formData.gender || null}
            onChange={(key) => handleChange("gender")(key ? String(key) : "")}
            isDisabled={loading}
          >
            <Label>Gender</Label>
            <Select.Trigger className="bg-card! text-foreground!">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {GENDERS.map((gender) => (
                  <ListBox.Item
                    key={gender}
                    id={gender}
                    textValue={gender}
                    className={OPTION_CLASS}
                  >
                    {gender}
                    <ListBox.ItemIndicator className="text-primary" />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField
            isRequired
            name="mobileNumber"
            type="tel"
            value={formData.mobileNumber}
            onChange={(val) => {
              handleChange("mobileNumber")(sanitizePHMobileInput(val));
            }}
            isDisabled={loading}
          >
            <Label>Mobile Number</Label>
            <Input className="bg-card! text-foreground!" placeholder="09XX XXX XXXX or +63 9XX XXX XXXX" inputMode="tel" />
          </TextField>

          <RegistrationBirthDateField name="birthDate" value={formData.birthDate} inputRef={birthDateRef} isDisabled={loading}
            error={birthDateError?.value === formData.birthDate ? birthDateError.message : null}
            onChange={value => { handleChange("birthDate")(value); setBirthDateError(null); }} />
        </div>
        {emailVerified ? <p className="text-sm text-muted-foreground">Your email is verified. <Link href="/sign-in" className="text-brand underline">Sign in</Link> to finish setting up your profile.</p> : null}

        {/* Address Information */}
        <h2 className="text-2xl font-bold font-nunito mb-3 mt-[clamp(1.5rem,4vh,2.5rem)] text-foreground">
          Address Information
        </h2>

        <RegistrationAddressFields value={address} errors={addressSubmitted ? addressErrors : undefined} isDisabled={loading}
          onChange={value => {
            setFormData(prev => ({ ...prev, stateProvince: value.province, city: value.city, barangay: value.barangay,
              streetAddress: value.streetAddress, postalCode: value.postalCode ? Number(value.postalCode) : undefined }));
            if (error) setError(null);
          }} />

        {/* Password */}
        <h2 className="text-2xl font-bold font-nunito mb-3 mt-[clamp(1.5rem,4vh,2.5rem)] text-foreground">
          Set Your Password
        </h2>

        <div className="w-full grid grid-cols-2 gap-5 md:grid-cols-2">
          <PasswordField
            isRequired
            label="Password"
            placeholder="Create a password"
            name="password"
            value={formData.password}
            onChange={handleChange("password")}
          />

          <PasswordField
            isRequired
            label="Confirm Password"
            placeholder="Confirm your password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
          />

          <PasswordRequirementList
            requirements={getPasswordRequirements(formData.password, formData.confirmPassword)}
            hasInput={formData.password.length > 0 || formData.confirmPassword.length > 0}
          />
        </div>

        <RegistrationPolicyAcceptance value={acceptance} onChange={value => { setAcceptance(value); setAcceptanceErrors({}); }}
          errors={acceptanceErrors} isDisabled={loading || otpFlow.loading || isOpen} />

        <Button
          variant="primary"
          className="w-full md:max-w-[300px] md:self-end rounded-full"
          size="lg"
          type="submit"
          isPending={loading}
          isDisabled={loading || otpFlow.loading || isOpen || !acceptance.termsAccepted || !acceptance.privacyAccepted}
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
        onOtpChange={(val) => { otpFlow.setOtp(val); if (!otpFlow.otpLocked) otpFlow.setOtpError(null); }}
        locked={otpFlow.otpLocked}
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
