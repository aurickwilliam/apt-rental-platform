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

import { GENDER_KEYS, enumLabel } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { completeProfile } from "../../actions/complete-profile";
import { validateBirthDate } from "@/lib/birth-date";
import { GENDERS } from "@repo/constants";
import RegistrationAddressFields from "../../components/RegistrationAddressFields";
import RegistrationBirthDateField from "../../components/RegistrationBirthDateField";
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
  const { language, t } = useTranslation();
  const [state, action, isPending] = useActionState(completeProfile, {});
  const [address, setAddress] = useState(() => resolveRegistrationAddress(initialAddress));
  const [addressSubmitted, setAddressSubmitted] = useState(() =>
    !!initialAddress && (["province", "city", "barangay"] as const).some(field =>
      !!initialAddress[field] && !resolveRegistrationAddress(initialAddress)[field]));
  const [mobileNumber, setMobileNumber] = useState("");
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
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
    if (error || Object.keys(validateRegistrationAddress(address)).length) e.preventDefault();
    if (error) birthDateRef.current?.querySelector<HTMLElement>('[role="spinbutton"]')?.focus();
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-[clamp(1.5rem,4vh,2rem)]">
      <input type="hidden" name="role" value={role} />

      {/* Personal Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif text-foreground">
          {t("auth.form.personalInfo")}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="email" isReadOnly defaultValue={email} fullWidth>
            <Label>{t("auth.email")}</Label>
            <Input className="bg-card! text-foreground!" />
          </TextField>

          <TextField name="first_name" isRequired defaultValue={firstName} fullWidth>
            <Label>{t("auth.form.firstName")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.firstNamePlaceholder")}
            />
          </TextField>

          <TextField name="last_name" isRequired defaultValue={lastName} fullWidth>
            <Label>{t("auth.form.lastName")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.lastNamePlaceholder")}
            />
          </TextField>

          <TextField name="middle_name" fullWidth>
            <Label>{t("auth.form.middleName")}</Label>
            <Input
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.middleNamePlaceholder")}
            />
          </TextField>

          <Select
            name="gender"
            isRequired
            fullWidth
            placeholder={t("auth.form.genderPlaceholder")}
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
                  >
                    {enumLabel(language, GENDER_KEYS, gender)}
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
            onChange={(val) => setMobileNumber(val.replace(/\D/g, "").slice(0, 11))}
          >
            <Label>{t("auth.form.mobile")}</Label>
            <Input
              inputMode="numeric"
              className="bg-card! text-foreground!"
              placeholder={t("auth.form.mobilePlaceholder")}
            />
          </TextField>

          <RegistrationBirthDateField name="birth_date" value={birthDate} error={fieldError} inputRef={birthDateRef} isDisabled={isPending}
            onChange={value => { setBirthDate(value); setBirthDateError(null); }} />
        </div>
      </section>

      <Separator />

      {/* Address Information */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium font-noto-serif text-foreground">
          {t("auth.form.addressInfo")}
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full font-semibold"
        isDisabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner size="sm" />
            {t("auth.form.completingProfile")}
          </>
        ) : (
          t("auth.form.completeProfile")
        )}
      </Button>
    </form>
  );
}
