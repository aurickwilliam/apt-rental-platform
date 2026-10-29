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
} from "@heroui/react";

import { useActionState, useRef, useState } from "react";
import { completeProfile } from "../../actions/complete-profile";
import { validateBirthDate } from "@/lib/birth-date";
import { GENDERS, sanitizePHMobileInput } from "@repo/constants";
import RegistrationAddressFields from "../../components/RegistrationAddressFields";
import RegistrationBirthDateField from "../../components/RegistrationBirthDateField";
import RegistrationPolicyAcceptance from "../../components/RegistrationPolicyAcceptance";
import { emptyRegistrationAcceptance, validateRegistrationAcceptance, type AcceptanceErrors } from "@/lib/registration-policies";
import { resolveRegistrationAddress, validateRegistrationAddress, type RegistrationAddress } from "@/lib/registration-address";

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
  const [address, setAddress] = useState(() => resolveRegistrationAddress(initialAddress));
  const [addressSubmitted, setAddressSubmitted] = useState(() =>
    !!initialAddress && (["province", "city", "barangay"] as const).some(field =>
      !!initialAddress[field] && !resolveRegistrationAddress(initialAddress)[field]));
  const [mobileNumber, setMobileNumber] = useState("");
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

  // Instant client-side feedback using the same shared validator the
  // server enforces; the server remains the real gate.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const error = validateBirthDate(birthDate);
    setBirthDateError(error);
    setAddressSubmitted(true);
    const policyErrors = validateRegistrationAcceptance(acceptance);
    setAcceptanceErrors(policyErrors);
    if (isPending || error || Object.keys(validateRegistrationAddress(address)).length || Object.keys(policyErrors).length) e.preventDefault();
    if (error) birthDateRef.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-[clamp(1.5rem,4vh,2rem)]">
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
            onChange={(val) => setMobileNumber(sanitizePHMobileInput(val))}
          >
            <Label>Mobile Number</Label>
            <Input inputMode="tel" className="bg-card! text-foreground!" placeholder="09XX XXX XXXX or +63 9XX XXX XXXX" />
          </TextField>

          <RegistrationBirthDateField name="birth_date" value={birthDate} error={fieldError} inputRef={birthDateRef} isDisabled={isPending}
            onChange={value => { setBirthDate(value); setBirthDateError(null); }} />
        </div>
      </section>

      <Separator />

      {/* Address Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif text-foreground">
          Address Information
        </h2>

        <RegistrationAddressFields value={address} onChange={setAddress} errors={addressErrors} isDisabled={isPending}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          names={{ province: "province", city: "city", barangay: "barangay", streetAddress: "street_address", postalCode: "postal_code" }} />
      </section>

      {state?.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">{state.error}</p>
        </div>
      )}

      <RegistrationPolicyAcceptance value={acceptance} onChange={value => { setAcceptance(value); setAcceptanceErrors({}); }}
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
