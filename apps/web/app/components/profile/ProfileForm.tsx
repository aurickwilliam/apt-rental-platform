"use client";

import { useActionState, useState } from "react";

import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Spinner,
  TextField,
} from "@heroui/react";

import { Lock } from "lucide-react";

import { GENDERS, PROVINCES } from "@repo/constants";
import { updateProfile } from "@/app/(auth)/actions/update-profile";

export type ProfileInitial = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  suffix: string | null;
  gender: string | null;
  mobile_number: string | null;
  birth_date: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postal_code: number | null;
};

function formatMissingList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function formatBirthDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

export default function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, action, isPending] = useActionState(updateProfile, {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [mobileNumber, setMobileNumber] = useState(initial.mobile_number ?? "");
  const [postalCode, setPostalCode] = useState(
    initial.postal_code != null ? String(initial.postal_code) : ""
  );
  const [gender, setGender] = useState(initial.gender ?? "");
  const [province, setProvince] = useState(initial.province ?? "");
  const [streetAddress, setStreetAddress] = useState(initial.street_address ?? "");
  const [barangay, setBarangay] = useState(initial.barangay ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [justSaved, setJustSaved] = useState(false);

  // Return to view mode after a successful save. Render-phase adjustment on the
  // new state object identity (one per completed submission), so repeat saves
  // with an identical message still transition.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) {
      setMode("view");
      setJustSaved(true);
    }
  }

  const resetToInitial = () => {
    setMobileNumber(initial.mobile_number ?? "");
    setPostalCode(initial.postal_code != null ? String(initial.postal_code) : "");
    setGender(initial.gender ?? "");
    setProvince(initial.province ?? "");
    setStreetAddress(initial.street_address ?? "");
    setBarangay(initial.barangay ?? "");
    setCity(initial.city ?? "");
    setErrors({});
  };

  const handleEdit = () => {
    setErrors({});
    setJustSaved(false);
    setMode("edit");
  };

  const handleCancel = () => {
    resetToInitial();
    setJustSaved(false);
    setMode("view");
  };

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const next: Record<string, string> = {};
    if (!gender.trim()) next.gender = "Gender is required.";
    if (!mobileNumber.trim()) next.mobile_number = "Mobile number is required.";
    else if (!/^09\d{9}$/.test(mobileNumber.trim()))
      next.mobile_number = "Must be 11 digits starting with 09.";
    if (!streetAddress.trim()) next.street_address = "Street address is required.";
    if (!barangay.trim()) next.barangay = "Barangay is required.";
    if (!city.trim()) next.city = "City is required.";
    if (!province.trim()) next.province = "Province is required.";
    if (!postalCode.trim()) next.postal_code = "Postal code is required.";
    else if (!/^\d{4}$/.test(postalCode.trim()))
      next.postal_code = "Must be 4 digits.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) e.preventDefault();
  };

  const fullName = [initial.first_name, initial.middle_name, initial.last_name, initial.suffix]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  const missingLabels: string[] = [];
  if (!gender.trim()) missingLabels.push("gender");
  if (!mobileNumber.trim()) missingLabels.push("mobile number");
  if (!streetAddress.trim()) missingLabels.push("street address");
  if (!barangay.trim()) missingLabels.push("barangay");
  if (!city.trim()) missingLabels.push("city");
  if (!province.trim()) missingLabels.push("province");
  if (!postalCode.trim()) missingLabels.push("postal code");

  if (mode === "view") {
    return (
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Profile Details</h2>
          <Button type="button" variant="outline" size="sm" onPress={handleEdit}>
            Edit
          </Button>
        </div>

        {justSaved && state?.success ? (
          <div className="rounded-lg border border-success-200 bg-success-50 p-3">
            <p className="text-center text-sm text-success">{state.success}</p>
          </div>
        ) : null}

        {missingLabels.length > 0 ? (
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
            <p className="text-sm text-warning">
              Your profile is incomplete — add your {formatMissingList(missingLabels)} so
              landlords can reach you and verify your application faster.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onPress={handleEdit}
            >
              Complete now
            </Button>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
        <section className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SummaryRow label="Full Name" value={fullName} />
            <SummaryRow label="Email" value={initial.email ?? ""} />
            <SummaryRow label="Birth Date" value={formatBirthDate(initial.birth_date)} />
          </div>
        </section>

        <Separator orientation="vertical" className="hidden lg:block" />
        <Separator className="my-2 lg:hidden" />

        <section className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold">Contact &amp; Address</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SummaryRow label="Mobile Number" value={mobileNumber} />
            <SummaryRow label="Gender" value={gender} />
            <SummaryRow label="Street Address" value={streetAddress} />
            <SummaryRow label="Barangay" value={barangay} />
            <SummaryRow label="City" value={city} />
            <SummaryRow label="Province" value={province} />
            <SummaryRow label="Postal Code" value={postalCode} />
          </div>
        </section>
        </div>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-10 max-w-3xl w-full mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Edit Profile</h2>
        <Button type="button" variant="ghost" size="sm" onPress={handleCancel}>
          Cancel
        </Button>
      </div>

      {/* Identity — read-only (names + birth date locked, like mobile) */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Personal Information</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField isReadOnly defaultValue={initial.email ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              Email <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField isReadOnly defaultValue={initial.first_name ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              First Name <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField isReadOnly defaultValue={initial.middle_name ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              Middle Name <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField isReadOnly defaultValue={initial.last_name ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              Last Name <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField isReadOnly defaultValue={initial.suffix ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              Suffix <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField isReadOnly defaultValue={formatBirthDate(initial.birth_date)} fullWidth>
            <Label className="flex items-center gap-1.5">
              Birth Date <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>
        </div>
        <p className="text-xs text-muted-foreground">
          Names and birth date are locked. Contact support if they need correction.
        </p>
      </section>

      <Separator className="my-2" />

      {/* Contact + address — editable */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Contact &amp; Address</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField
            name="mobile_number"
            isRequired
            fullWidth
            value={mobileNumber}
            onChange={(val: string) => {
              setMobileNumber(val.replace(/\D/g, "").slice(0, 11));
              clearError("mobile_number");
            }}
            isInvalid={!!errors.mobile_number}
          >
            <Label>Mobile Number</Label>
            <Input inputMode="numeric" placeholder="09XXXXXXXXX" />
            <FieldError>{errors.mobile_number}</FieldError>
          </TextField>

          <div>
            <input type="hidden" name="gender" value={gender} />
            <Select
              isRequired
              fullWidth
              placeholder="Select your gender"
              value={gender || null}
              onChange={(key) => {
                setGender(key ? String(key) : "");
                clearError("gender");
              }}
              isInvalid={!!errors.gender}
            >
              <Label>Gender</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {GENDERS.map((option) => (
                    <ListBox.Item key={option} id={option} textValue={option}>
                      {option}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            {errors.gender ? (
              <p className="text-sm text-danger mt-1">{errors.gender}</p>
            ) : null}
          </div>

          <TextField
            name="street_address"
            isRequired
            fullWidth
            value={streetAddress}
            onChange={(val: string) => {
              setStreetAddress(val);
              clearError("street_address");
            }}
            isInvalid={!!errors.street_address}
          >
            <Label>Street Address</Label>
            <Input placeholder="Enter your street address" />
            <FieldError>{errors.street_address}</FieldError>
          </TextField>

          <TextField
            name="barangay"
            isRequired
            fullWidth
            value={barangay}
            onChange={(val: string) => {
              setBarangay(val);
              clearError("barangay");
            }}
            isInvalid={!!errors.barangay}
          >
            <Label>Barangay</Label>
            <Input placeholder="Enter your barangay" />
            <FieldError>{errors.barangay}</FieldError>
          </TextField>

          <TextField
            name="city"
            isRequired
            fullWidth
            value={city}
            onChange={(val: string) => {
              setCity(val);
              clearError("city");
            }}
            isInvalid={!!errors.city}
          >
            <Label>City</Label>
            <Input placeholder="Enter your city" />
            <FieldError>{errors.city}</FieldError>
          </TextField>

          <div>
            <input type="hidden" name="province" value={province} />
            <Select
              isRequired
              fullWidth
              placeholder="Select your province"
              value={province || null}
              onChange={(key) => {
                setProvince(key ? String(key) : "");
                clearError("province");
              }}
              isInvalid={!!errors.province}
            >
              <Label>Province</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {PROVINCES.map((option) => (
                    <ListBox.Item key={option} id={option} textValue={option}>
                      {option}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            {errors.province ? (
              <p className="text-sm text-danger mt-1">{errors.province}</p>
            ) : null}
          </div>

          <TextField
            name="postal_code"
            isRequired
            fullWidth
            value={postalCode}
            onChange={(val: string) => {
              setPostalCode(val.replace(/\D/g, "").slice(0, 4));
              clearError("postal_code");
            }}
            isInvalid={!!errors.postal_code}
          >
            <Label>Postal Code</Label>
            <Input placeholder="Enter your postal code" inputMode="numeric" maxLength={4} />
            <FieldError>{errors.postal_code}</FieldError>
          </TextField>
        </div>
      </section>

      {state?.error ? (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">{state.error}</p>
        </div>
      ) : null}

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
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
