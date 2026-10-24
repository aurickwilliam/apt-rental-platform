"use client";

import { useState } from "react";
import {
  Form,
  Button,
  Input,
  Select,
  DatePicker,
  useOverlayState,
  TextField, 
  Label,
  ListBox,
  DateField,
  Calendar,
  FieldError,
} from "@heroui/react";

import { useAuth } from "../../components/AuthContext";
import PasswordField from "@/app/components/inputs/PasswordField";

import PasswordRequirementList from "@/app/components/inputs/PasswordRequirementList";
import OtpModal from "./OtpModal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

import { useOtpFlow } from "../hooks/useOtpFlow";
import { validateForm } from "../utils";
import { SignUpFormData } from "../types";

import {
  PROVINCES,
  GENDERS,
  SUFFIXES,
  getCitiesByProvince,
  getBarangaysByCity,
  getPasswordRequirements,
  isZipPlausibleForCity,
  type Province,
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

  const handleProvinceChange = (province: string) => {
    setFormData((prev) => ({
      ...prev,
      stateProvince: province,
      city: "",
      barangay: "",
    }));
    if (error) setError(null);
  };

  const handleCityChange = (city: string) => {
    setFormData((prev) => ({
      ...prev,
      city,
      barangay: "",
    }));
    if (error) setError(null);
  };

  const cities = formData.stateProvince
    ? getCitiesByProvince(formData.stateProvince as Province)
    : [];
  const barangays = getBarangaysByCity(formData.city);

  // Live feedback once all four digits are in and a city is chosen.
  const postalCodeText = formData.postalCode !== undefined ? String(formData.postalCode) : "";
  const postalCodeError =
    formData.city &&
    postalCodeText.length === 4 &&
    !isZipPlausibleForCity(formData.city, formData.stateProvince, postalCodeText)
      ? `Enter a valid postal code for ${formData.city}.`
      : null;

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
              const digits = val.replace(/\D/g, "").slice(0, 11);
              handleChange("mobileNumber")(digits);
            }}
            isDisabled={loading}
          >
            <Label>Mobile Number</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your mobile number" inputMode="numeric" />
          </TextField>

          <DatePicker
            name="birthDate"
            isRequired
            isDisabled={loading}
            onChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                birthDate: value ? String(value) : "",
              }));
              if (error) setError(null);
            }}
          >
            <Label>Birth Date</Label>
            <DateField.Group fullWidth className="border border-grey-300">
              <DateField.Input>
                {(segment) => (
                  <DateField.Segment
                    segment={segment}
                    className="data-[placeholder=true]:text-foreground/40 text-foreground"
                  />
                )}
              </DateField.Input>
              <DateField.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator className="text-grey-500" />
                </DatePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>

            <DatePicker.Popover>
              <Calendar aria-label="Birth Date">
                <Calendar.Header>
                  <Calendar.YearPickerTrigger>
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator className="text-grey-500" />
                  </Calendar.YearPickerTrigger>

                  <Calendar.NavButton slot="previous" className="text-grey-500" />
                  <Calendar.NavButton slot="next" className="text-grey-500" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => (
                      <Calendar.Cell
                        date={date}
                        className="data-selected:bg-primary data-selected:text-white"
                      />
                    )}
                  </Calendar.GridBody>
                </Calendar.Grid>

                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {(yearProps) => (
                      <Calendar.YearPickerCell
                        year={yearProps.year}
                        className="data-selected:bg-primary data-selected:text-white"
                      />
                    )}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        </div>

        {/* Address Information */}
        <h2 className="text-2xl font-bold font-nunito mb-3 mt-[clamp(1.5rem,4vh,2.5rem)] text-foreground">
          Address Information
        </h2>

        <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-2">
          <Select
            isRequired
            placeholder="Select your state/province"
            name="stateProvince"
            className="w-full"
            value={formData.stateProvince || null}
            onChange={(key) => handleProvinceChange(key ? String(key) : "")}
            isDisabled={loading}
          >
            <Label>State/Province</Label>
            <Select.Trigger className="bg-card! text-foreground!">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {PROVINCES.map((option) => (
                  <ListBox.Item
                    key={option}
                    id={option}
                    textValue={option}
                    className={OPTION_CLASS}
                  >
                    {option}
                    <ListBox.ItemIndicator className="text-primary" />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            isRequired
            placeholder={formData.stateProvince ? "Select your city" : "Select a province first"}
            name="city"
            className="w-full"
            value={formData.city || null}
            onChange={(key) => handleCityChange(key ? String(key) : "")}
            isDisabled={loading || !formData.stateProvince}
          >
            <Label>City</Label>
            <Select.Trigger className="bg-card! text-foreground!">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {cities.map((option) => (
                  <ListBox.Item
                    key={option}
                    id={option}
                    textValue={option}
                    className={OPTION_CLASS}
                  >
                    {option}
                    <ListBox.ItemIndicator className="text-primary" />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            isRequired
            placeholder={formData.city ? "Select your barangay" : "Select a city first"}
            name="barangay"
            className="w-full"
            value={formData.barangay || null}
            onChange={(key) => handleChange("barangay")(key ? String(key) : "")}
            isDisabled={loading || !formData.city}
          >
            <Label>Barangay</Label>
            <Select.Trigger className="bg-card! text-foreground!">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox className="max-h-64 overflow-y-auto">
                {barangays.map((option) => (
                  <ListBox.Item
                    key={option}
                    id={option}
                    textValue={option}
                    className={OPTION_CLASS}
                  >
                    {option}
                    <ListBox.ItemIndicator className="text-primary" />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField
            isRequired
            name="streetAddress"
            type="text"
            value={formData.streetAddress}
            onChange={handleChange("streetAddress")}
            isDisabled={loading}
          >
            <Label>Street Address</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your street address" />
          </TextField>

          <TextField
            isRequired
            name="postalCode"
            isInvalid={!!postalCodeError}
            value={postalCodeText}
            onChange={(val) => {
              const digits = val.replace(/\D/g, "").slice(0, 4);
              setFormData((prev) => ({
                ...prev,
                postalCode: digits ? Number(digits) : undefined,
              }));
              if (error) setError(null);
            }}
            validate={(val) => {
              if (!val) return "Postal code is required.";
              if (!/^\d{4}$/.test(val)) return "Enter a valid 4-digit postal code.";
              const num = Number(val);
              if (num < 1000 || num > 9999) return "Postal code must be between 1000 and 9999.";
              return true;
            }}
            isDisabled={loading}
          >
            <Label>Postal Code</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder="Enter your postal code"
              inputMode="numeric"
            />
            <FieldError>{postalCodeError}</FieldError>
          </TextField>
        </div>

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

        <Button
          variant="primary"
          className="w-full mt-[clamp(1.25rem,3vh,1.5rem)] md:max-w-[300px] md:self-end rounded-full"
          size="lg"
          type="submit"
          isPending={loading}
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