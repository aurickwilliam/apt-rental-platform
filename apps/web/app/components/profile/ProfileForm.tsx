"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

import {
  IconId,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";

import { GENDERS, PROVINCES } from "@repo/constants";
import { createBrowserClient } from "@repo/supabase";
import { updateProfile } from "@/app/(auth)/actions/update-profile";
import {
  compressAvatarImage,
  compressBackgroundImage,
  uploadAvatar,
  uploadBackground,
} from "@/lib/avatar-upload";
import ProfileAvatar from "./ProfileAvatar";
import ProfileBackground from "./ProfileBackground";
import ProfilePhotoErrorDialog from "./ProfilePhotoErrorDialog";
import ProfileSaveSuccessDialog from "./ProfileSaveSuccessDialog";

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export default function ProfileForm({
  initial,
  initialMode = "view",
  showMissingPrompt = true,
  align = "center",
  successRedirectHref,
  showEditHeading = true,
  photoEditing,
}: {
  initial: ProfileInitial;
  initialMode?: "view" | "edit";
  showMissingPrompt?: boolean;
  align?: "center" | "left";
  successRedirectHref?: string;
  showEditHeading?: boolean;
  photoEditing?: {
    authUserId: string;
    avatarUrl: string | null;
    backgroundUrl: string | null;
  };
}) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(updateProfile, {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagedAvatar, setStagedAvatar] = useState<File | null>(null);
  const [stagedBackground, setStagedBackground] = useState<File | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const photosCommittedRef = useRef(false);

  const [mobileNumber, setMobileNumber] = useState(initial.mobile_number ?? "");
  const [postalCode, setPostalCode] = useState(
    initial.postal_code != null ? String(initial.postal_code) : "",
  );
  const [gender, setGender] = useState(initial.gender ?? "");
  const [province, setProvince] = useState(initial.province ?? "");
  const [streetAddress, setStreetAddress] = useState(
    initial.street_address ?? "",
  );
  const [barangay, setBarangay] = useState(initial.barangay ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [justSaved, setJustSaved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Return to view mode after a successful save. Render-phase adjustment on the
  // new state object identity (one per completed submission), so repeat saves
  // with an identical message still transition. When a redirect target is set,
  // show the success modal instead — closing it routes away.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) {
      if (successRedirectHref) {
        setShowSuccessModal(true);
      } else {
        setMode("view");
        setJustSaved(true);
      }
    }
  }

  const handleSuccessClose = () => {
    if (successRedirectHref) router.push(successRedirectHref);
  };

  const handleEdit = () => {
    setErrors({});
    setJustSaved(false);
    setMode("edit");
  };

  const handleAvatarSelect = (file: File | null) => {
    setStagedAvatar(file);
    photosCommittedRef.current = false;
  };

  const handleBackgroundSelect = (file: File | null) => {
    setStagedBackground(file);
    photosCommittedRef.current = false;
  };

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const next: Record<string, string> = {};
    if (!gender.trim()) next.gender = "Gender is required.";
    if (!mobileNumber.trim()) next.mobile_number = "Mobile number is required.";
    else if (!/^09\d{9}$/.test(mobileNumber.trim()))
      next.mobile_number = "Must be 11 digits starting with 09.";
    if (!streetAddress.trim())
      next.street_address = "Street address is required.";
    if (!barangay.trim()) next.barangay = "Barangay is required.";
    if (!city.trim()) next.city = "City is required.";
    if (!province.trim()) next.province = "Province is required.";
    if (!postalCode.trim()) next.postal_code = "Postal code is required.";
    else if (!/^\d{4}$/.test(postalCode.trim()))
      next.postal_code = "Must be 4 digits.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      e.preventDefault();
      return;
    }
    // Staged photos commit first, then the field update submits normally.
    if (
      photoEditing &&
      (stagedAvatar || stagedBackground) &&
      !photosCommittedRef.current
    ) {
      e.preventDefault();
      setIsUploadingPhotos(true);
      try {
        const supabase = createBrowserClient();
        if (stagedAvatar) {
          const compressed = await compressAvatarImage(stagedAvatar);
          await uploadAvatar(supabase, photoEditing.authUserId, compressed);
        }
        if (stagedBackground) {
          const compressed = await compressBackgroundImage(stagedBackground);
          await uploadBackground(
            supabase,
            photoEditing.authUserId,
            compressed,
          );
        }
        photosCommittedRef.current = true;
        setStagedAvatar(null);
        setStagedBackground(null);
        formRef.current?.requestSubmit();
      } catch (err) {
        console.error("Staged photo upload failed", err);
        const raw =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setPhotoError(
          /permission denied|row-level security/i.test(raw)
            ? "Couldn't save your photos due to a permissions issue. Please try again later."
            : raw,
        );
      } finally {
        setIsUploadingPhotos(false);
      }
    }
  };

  const fullName = [
    initial.first_name,
    initial.middle_name,
    initial.last_name,
    initial.suffix,
  ]
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

  const fieldsDirty =
    mobileNumber !== (initial.mobile_number ?? "") ||
    gender !== (initial.gender ?? "") ||
    streetAddress !== (initial.street_address ?? "") ||
    barangay !== (initial.barangay ?? "") ||
    city !== (initial.city ?? "") ||
    province !== (initial.province ?? "") ||
    postalCode !==
      (initial.postal_code != null ? String(initial.postal_code) : "");
  const isPristine =
    !fieldsDirty && stagedAvatar === null && stagedBackground === null;

  const displayName =
    fullName || initial.email || "User";

  if (mode === "view") {
    return (
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
            <IconUser
              size={20}
              className="shrink-0 text-primary"
              aria-hidden="true"
            />
            Profile Details
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={handleEdit}
          >
            Edit
          </Button>
        </div>

        {justSaved && state?.success ? (
          <div className="rounded-lg border border-success-200 bg-success-50 p-3">
            <p className="text-center text-sm text-success">{state.success}</p>
          </div>
        ) : null}

        {showMissingPrompt && missingLabels.length > 0 ? (
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
            <p className="text-sm text-warning">
              Your profile is incomplete — add your{" "}
              {formatMissingList(missingLabels)} so landlords can reach you and
              verify your application faster.
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
            <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
              <IconId
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SummaryRow label="Full Name" value={fullName} />
              <SummaryRow label="Email" value={initial.email ?? ""} />
              <SummaryRow
                label="Birth Date"
                value={formatBirthDate(initial.birth_date)}
              />
            </div>
          </section>

          <Separator orientation="vertical" className="hidden lg:block" />
          <Separator className="my-2 lg:hidden" />

          <section className="flex flex-col gap-6">
            <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
              <IconPhone
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              Contact
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SummaryRow label="Mobile Number" value={mobileNumber} />
              <SummaryRow label="Gender" value={gender} />
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
              <IconMapPin
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              Address
            </h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      className={
        align === "left"
          ? "flex flex-col gap-5 w-full"
          : "flex flex-col gap-5 max-w-3xl w-full mx-auto"
      }
    >
      <ProfileSaveSuccessDialog
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
      />
      {photoError ? (
        <ProfilePhotoErrorDialog
          message={photoError}
          onClose={() => setPhotoError(null)}
        />
      ) : null}
      {photoEditing ? (
        <div>
          <div className="-m-4 sm:-m-5">
            <ProfileBackground
              authUserId={photoEditing.authUserId}
              initialUrl={photoEditing.backgroundUrl}
              staged
              onFileSelect={handleBackgroundSelect}
            />
          </div>
          <div className="-mt-12 ml-2 w-fit">
            <ProfileAvatar
              authUserId={photoEditing.authUserId}
              initialUrl={photoEditing.avatarUrl}
              initials={getInitials(displayName)}
              displayName={displayName}
              circular
              staged
              onFileSelect={handleAvatarSelect}
            />
          </div>
        </div>
      ) : null}
      {showEditHeading ? (
        <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
          <IconPencil
            size={20}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          Edit Profile
        </h2>
      ) : null}

      {/* Identity — read-only (names + birth date locked, like mobile) */}
      <section className="flex flex-col gap-6">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
          <IconId
            size={20}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          Personal Information
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField isReadOnly defaultValue={initial.email ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              Email{" "}
              <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField
            isReadOnly
            defaultValue={initial.first_name ?? "—"}
            fullWidth
          >
            <Label className="flex items-center gap-1.5">
              First Name{" "}
              <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField
            isReadOnly
            defaultValue={initial.middle_name ?? "—"}
            fullWidth
          >
            <Label className="flex items-center gap-1.5">
              Middle Name{" "}
              <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField
            isReadOnly
            defaultValue={initial.last_name ?? "—"}
            fullWidth
          >
            <Label className="flex items-center gap-1.5">
              Last Name{" "}
              <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField isReadOnly defaultValue={initial.suffix ?? "—"} fullWidth>
            <Label className="flex items-center gap-1.5">
              Suffix{" "}
              <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>

          <TextField
            isReadOnly
            defaultValue={formatBirthDate(initial.birth_date)}
            fullWidth
          >
            <Label className="flex items-center gap-1.5">
              Birth Date{" "}
              <Lock size={12} className="text-muted-foreground" aria-hidden />
            </Label>
            <Input className="bg-muted text-muted-foreground cursor-not-allowed" />
          </TextField>
        </div>
        <p className="text-xs text-muted-foreground">
          Names and birth date are locked. Contact support if they need
          correction.
        </p>
      </section>

      <Separator className="my-2" />

      {/* Contact — editable */}
      <section className="flex flex-col gap-6">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
          <IconPhone
            size={20}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          Contact
        </h2>

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
        </div>
      </section>

      <Separator className="my-2" />

      {/* Address — editable */}
      <section className="flex flex-col gap-6">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
          <IconMapPin
            size={20}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          Address
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
            <Input
              placeholder="Enter your postal code"
              inputMode="numeric"
              maxLength={4}
            />
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
        isDisabled={isPending || isUploadingPhotos || isPristine}
      >
        {isPending || isUploadingPhotos ? (
          <>
            <Spinner size="sm" />
            {isUploadingPhotos ? "Uploading photos..." : "Saving..."}
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
