"use client";

import {
  TextField,
  Input,
  Label,
  Select,
  ListBox,
  Button,
  Separator,
  Spinner,
  FieldError,
} from "@heroui/react";

import { startTransition, useActionState, useRef, useState } from "react";
import { completeProfile, type CompleteProfileState } from "../../actions/complete-profile";
import { validateBirthDate } from "@/lib/birth-date";
import { GENDERS, PH_MOBILE_MAX_INPUT_LENGTH, formatPHMobileInput, validatePHMobile } from "@repo/constants";
import RegistrationAddressFields from "../../components/RegistrationAddressFields";
import RegistrationBirthDateField from "../../components/RegistrationBirthDateField";
import RegistrationPolicyAcceptance from "../../components/RegistrationPolicyAcceptance";
import { emptyRegistrationAcceptance, validateRegistrationAcceptance, type AcceptanceErrors } from "@/lib/registration-policies";
import { resolveRegistrationAddress, validateRegistrationAddress, type RegistrationAddress } from "@/lib/registration-address";

const ADDRESS_FIELDS = ["province", "city", "barangay", "streetAddress", "postalCode"] as const;

function registrationAddressesMatch(first: RegistrationAddress, second: RegistrationAddress) {
  return ADDRESS_FIELDS.every(field => first[field] === second[field]);
}

type Props = {
  email: string;
  firstName: string;
  lastName: string;
  role: "tenant" | "landlord";
  initialAddress?: Partial<RegistrationAddress>;
  initialBirthDate?: string;
};

export default function CompleteProfileForm({
  email,
  firstName,
  lastName,
  role,
  initialAddress,
  initialBirthDate,
}: Props) {
  const [state, action, isPending] = useActionState(completeProfile, {});
  // A rejected submit's banner describes the data that was submitted, so hide
  // it as soon as the user edits anything; a new response replaces it.
  const [dismissedState, setDismissedState] = useState<CompleteProfileState | null>(null);
  const dismissServerError = () => { if (state.error) setDismissedState(state); };
  const [address, setAddress] = useState(() => resolveRegistrationAddress(initialAddress));
  const [addressSubmitted, setAddressSubmitted] = useState(() =>
    !!initialAddress && (["province", "city", "barangay"] as const).some(field =>
      !!initialAddress[field] && !resolveRegistrationAddress(initialAddress)[field]));
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileTouched, setMobileTouched] = useState(false);
  const mobileRef = useRef<HTMLInputElement>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [acceptance, setAcceptance] = useState(emptyRegistrationAcceptance);
  const [acceptanceErrors, setAcceptanceErrors] = useState<AcceptanceErrors>({});
  const [previousAcceptanceErrors, setPreviousAcceptanceErrors] = useState(state.acceptanceErrors);
  if (previousAcceptanceErrors !== state.acceptanceErrors) {
    setPreviousAcceptanceErrors(state.acceptanceErrors);
    if (state.acceptanceErrors) {
      setAcceptance(previous => ({ ...previous, termsAccepted: false, privacyAccepted: false }));
      setAcceptanceErrors(state.acceptanceErrors);
    }
  }
  const birthDateRef = useRef<HTMLDivElement>(null);
  // A server error belongs to the submitted date, not a subsequently edited one.
  const fieldError = birthDateError ?? (state.birthDate === birthDate ? state.birthDateError : null);
  const serverAddressMatches = state.address && (Object.keys(address) as (keyof RegistrationAddress)[])
    .every(field => state.address?.[field] === address[field]);
  const addressErrors = { ...(serverAddressMatches ? state.addressErrors : {}), ...(addressSubmitted ? validateRegistrationAddress(address) : {}) };

  // Shown once the field was left or a submit was tried, then kept live.
  const mobileError = mobileTouched ? validatePHMobile(mobileNumber).errorMessage : null;

  // Instant client-side feedback using the same shared validator the
  // server enforces; the server remains the real gate. Browser autofill can
  // update a control without React seeing it, so validate exactly what this
  // submit will send and sync the visible fields with it.
  //
  // Dispatch the action ourselves: React resets a form after every form
  // action, and react-aria clears its controlled controls on that reset even
  // when the `reset` event is cancelled. A rejected submit must keep the
  // draft for correction and retry, so the browser never owns this submit.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const readField = (name: string, fallback = "") => {
      const value = formData.get(name);
      return typeof value === "string" ? value : fallback;
    };
    const submittedAddress = resolveRegistrationAddress({
      province: readField("province", address.province),
      city: readField("city", address.city),
      barangay: readField("barangay", address.barangay),
      streetAddress: readField("street_address", address.streetAddress),
      postalCode: readField("postal_code", address.postalCode),
    });
    const submittedMobile = formatPHMobileInput(readField("mobile_number", mobileNumber));
    // Some browsers omit react-aria's date input from FormData; keep the
    // tracked date then rather than clearing it.
    const submittedBirthDate = readField("birth_date", birthDate);
    if (!registrationAddressesMatch(submittedAddress, address)) setAddress(submittedAddress);
    if (submittedMobile !== mobileNumber) setMobileNumber(submittedMobile);
    if (submittedBirthDate !== birthDate) setBirthDate(submittedBirthDate);

    const error = validateBirthDate(submittedBirthDate);
    setBirthDateError(error);
    setAddressSubmitted(true);
    const policyErrors = validateRegistrationAcceptance(acceptance);
    setAcceptanceErrors(policyErrors);
    setMobileTouched(true);
    const mobileInvalid = !!validatePHMobile(submittedMobile).errorMessage;
    const addressInvalid = Object.keys(validateRegistrationAddress(submittedAddress)).length > 0;
    if (error) birthDateRef.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
    else if (mobileInvalid) mobileRef.current?.focus();
    if (isPending || error || mobileInvalid || addressInvalid || Object.keys(policyErrors).length) return;
    // A form-action dispatch is a transition, so keep that here or isPending
    // would not update while the server action runs.
    startTransition(() => action(formData));
  };

  return (
    <form onSubmit={handleSubmit} onInput={dismissServerError} onChange={dismissServerError} className="flex flex-col gap-[clamp(1.5rem,4vh,2rem)]">
      <input type="hidden" name="role" value={role} />

      {/* Personal Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif text-foreground">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="email" isReadOnly defaultValue={email} fullWidth>
            <Label>Email</Label>
            <Input className="bg-card! text-foreground!" />
          </TextField>

          <TextField name="first_name" isRequired defaultValue={firstName} fullWidth>
            <Label>First Name</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your first name" />
          </TextField>

          <TextField name="last_name" isRequired defaultValue={lastName} fullWidth>
            <Label>Last Name</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your last name" />
          </TextField>

          <TextField name="middle_name" fullWidth>
            <Label>Middle Name</Label>
            <Input className="bg-card! text-foreground!" placeholder="Enter your middle name (optional)" />
          </TextField>

          <Select name="gender" isRequired fullWidth placeholder="Select your gender">
            <Label>Gender</Label>
            <Select.Trigger className="bg-card! text-foreground!">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {GENDERS.map((gender) => (
                  <ListBox.Item key={gender} id={gender} textValue={gender}>
                    {gender}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField
            name="mobile_number"
            isRequired
            fullWidth
            value={mobileNumber}
            onChange={(val) => { setMobileNumber(formatPHMobileInput(val)); dismissServerError(); }}
            onBlur={() => setMobileTouched(true)}
            isInvalid={!!mobileError}
          >
            <Label>Mobile Number</Label>
            <Input ref={mobileRef} inputMode="tel" className="bg-card! text-foreground!" placeholder="09XX XXX XXXX" maxLength={PH_MOBILE_MAX_INPUT_LENGTH} />
            <FieldError className="text-xs">{mobileError}</FieldError>
          </TextField>

          <RegistrationBirthDateField name="birth_date" value={birthDate} error={fieldError} inputRef={birthDateRef} isDisabled={isPending}
            onChange={value => { setBirthDate(value); setBirthDateError(null); dismissServerError(); }} />
        </div>
      </section>

      <Separator />

      {/* Address Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif text-foreground">
          Address Information
        </h2>

        <RegistrationAddressFields value={address} onChange={value => { setAddress(value); dismissServerError(); }} errors={addressErrors} isDisabled={isPending}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          names={{ province: "province", city: "city", barangay: "barangay", streetAddress: "street_address", postalCode: "postal_code" }} />
      </section>

      {state.error && dismissedState !== state && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">{state.error}</p>
        </div>
      )}

      <RegistrationPolicyAcceptance value={acceptance} onChange={value => { setAcceptance(value); setAcceptanceErrors({}); dismissServerError(); }}
        errors={acceptanceErrors} isDisabled={isPending} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-semibold"
        isDisabled={isPending || !acceptance.termsAccepted || !acceptance.privacyAccepted}
      >
        {isPending ? (
          <>
            <Spinner size="sm" />
            Completing Profile...
          </>
        ) : (
          "Complete Profile"
        )}
      </Button>
    </form>
  );
}
