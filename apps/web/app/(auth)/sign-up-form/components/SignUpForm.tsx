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

import { GENDER_KEYS, enumLabel } from "@repo/i18n";

import { useAuth } from "../../components/AuthContext";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
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
import { validateRegistrationAddress, type RegistrationAddress } from "@/lib/registration-address";

import {
  GENDERS,
  SUFFIXES,
  getPasswordRequirements,
} from "@repo/constants";
import { sendEmailOtp } from "../../actions/send-otp";

// Selected option: soft blue surface with a primary-blue check.
const OPTION_CLASS =
  "data-[hovered=true]:bg-light-blue! data-[selected=true]:bg-primary/10! data-[selected=true]:text-primary";

const NO_SUFFIX = "none";

export default function SignUpForm() {
  const { role, email } = useAuth();
  const { language, t } = useTranslation();

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
  const otpFlow = useOtpFlow({ formData, role, showError, onSuccessOpen, onBirthDateError: showBirthDateError });

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

    setLoading(true);
    try {
      const result = await sendEmailOtp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.birthDate,
      );
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
      showError(t("auth.error.sendCodeFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit} className="flex flex-col gap-[clamp(1.25rem,3vh,1.25rem)] my-[clamp(2rem,5vh,2.5rem)]">
        {/* Personal Information */}
        <h2 className="text-2xl font-bold font-nunito mb-3 text-foreground">
          {t("auth.form.personalInfo")}
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
            <Label>{t("auth.email")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.emailPlaceholder")}
            />
          </TextField>

          <TextField
            isRequired
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange("firstName")}
            isDisabled={loading}
          >
            <Label>{t("auth.form.firstName")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.firstNamePlaceholder")}
            />
          </TextField>

          <TextField
            isRequired
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            isDisabled={loading}
          >
            <Label>{t("auth.form.lastName")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.lastNamePlaceholder")}
            />
          </TextField>

          <TextField
            name="middleName"
            type="text"
            value={formData.middleName}
            onChange={handleChange("middleName")}
            isDisabled={loading}
          >
            <Label>{t("auth.form.middleName")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.middleNamePlaceholder")}
            />
          </TextField>

          <Select
            name="suffix"
            placeholder={t("auth.form.noSuffix")}
            value={formData.suffix || null}
            onChange={(key) => handleChange("suffix")(key && key !== NO_SUFFIX ? String(key) : "")}
            isDisabled={loading}
          >
            <Label>{t("auth.form.suffix")}</Label>
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
                    textValue={option === NO_SUFFIX ? t("auth.form.noSuffix") : option}
                    className={OPTION_CLASS}
                  >
                    {option === NO_SUFFIX ? t("auth.form.noSuffix") : option}
                    <ListBox.ItemIndicator className="text-primary" />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            isRequired
            name="gender"
            placeholder={t("auth.form.genderPlaceholder")}
            value={formData.gender || null}
            onChange={(key) => handleChange("gender")(key ? String(key) : "")}
            isDisabled={loading}
          >
            <Label>{t("auth.form.gender")}</Label>
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
                    textValue={enumLabel(language, GENDER_KEYS, gender)}
                    className={OPTION_CLASS}
                  >
                    {enumLabel(language, GENDER_KEYS, gender)}
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
              const digits = val.replace(/\D/g, "").slice(0, 11);
              handleChange("mobileNumber")(digits);
            }}
            isDisabled={loading}
          >
            <Label>{t("auth.form.mobile")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.mobilePlaceholder")}
              inputMode="numeric"
            />
          </TextField>

          <RegistrationBirthDateField name="birthDate" value={formData.birthDate} inputRef={birthDateRef} isDisabled={loading}
            error={birthDateError?.value === formData.birthDate ? birthDateError.message : null}
            onChange={value => { handleChange("birthDate")(value); setBirthDateError(null); }} />
        </div>
        {emailVerified ? (
          <p className="text-sm text-muted-foreground">
            {t("auth.form.emailVerified")}{" "}
            <Link href="/sign-in" className="text-brand underline">
              {t("auth.signIn.action")}
            </Link>{" "}
            {t("auth.form.emailVerifiedHint")}
          </p>
        ) : null}

        {/* Address Information */}
        <h2 className="text-2xl font-bold font-nunito mb-3 mt-[clamp(1.5rem,4vh,2.5rem)] text-foreground">
          {t("auth.form.addressInfo")}
        </h2>

        <RegistrationAddressFields value={address} errors={addressSubmitted ? addressErrors : undefined} isDisabled={loading}
          onChange={value => {
            setFormData(prev => ({ ...prev, stateProvince: value.province, city: value.city, barangay: value.barangay,
              streetAddress: value.streetAddress, postalCode: value.postalCode ? Number(value.postalCode) : undefined }));
            if (error) setError(null);
          }} />

        {/* Password */}
        <h2 className="text-2xl font-bold font-nunito mb-3 mt-[clamp(1.5rem,4vh,2.5rem)] text-foreground">
          {t("auth.form.setPassword")}
        </h2>

        <div className="w-full grid grid-cols-2 gap-5 md:grid-cols-2">
          <PasswordField
            isRequired
            label={t("auth.password")}
            placeholder={t("auth.form.passwordPlaceholder")}
            name="password"
            value={formData.password}
            onChange={handleChange("password")}
          />

          <PasswordField
            isRequired
            label={t("auth.confirmPasswordLabel")}
            placeholder={t("auth.form.confirmPasswordPlaceholder")}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
          />

          <PasswordRequirementList
            requirements={getPasswordRequirements(formData.password, formData.confirmPassword)}
            hasInput={formData.password.length > 0 || formData.confirmPassword.length > 0}
          />
        </div>

        <Button
          variant="primary"
          className="w-full mt-[clamp(1.25rem,3vh,1.5rem)] md:max-w-[300px] md:self-end rounded-full"
          size="lg"
          type="submit"
          isPending={loading}
          isDisabled={loading}
        >
          {loading ? t("auth.form.creatingAccount") : t("auth.signUp.action")}
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
