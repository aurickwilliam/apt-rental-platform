"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Spinner,
  TextField,
  toast,
  useOverlayState,
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
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="min-w-0 text-sm break-words">{value?.trim() ? value : "—"}</p>
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

type FieldKey =
  | "gender"
  | "mobile_number"
  | "street_address"
  | "barangay"
  | "city"
  | "province"
  | "postal_code";

type EditableBaseline = Record<FieldKey, string>;

const FIELD_KEYS: FieldKey[] = [
  "gender",
  "mobile_number",
  "street_address",
  "barangay",
  "city",
  "province",
  "postal_code",
];

function snapshotOf(source: ProfileInitial): EditableBaseline {
  return {
    gender: source.gender ?? "",
    mobile_number: source.mobile_number ?? "",
    street_address: source.street_address ?? "",
    barangay: source.barangay ?? "",
    city: source.city ?? "",
    province: source.province ?? "",
    postal_code:
      source.postal_code != null ? String(source.postal_code) : "",
  };
}

// Accept 09XXXXXXXXX or +639XXXXXXXXX; normalize to the 09 form the
// backend validates so no server rule change is needed.
function normalizeMobileNumber(value: string): string {
  const trimmed = value.trim();
  if (/^\+63\d{10}$/.test(trimmed)) return `0${trimmed.slice(3)}`;
  return trimmed;
}

// Map a backend error string to the field it belongs to, if any.
// The update-profile action returns a single message (no field key),
// so match on the known message shapes; unknown errors stay generic.
function fieldForBackendError(message: string): FieldKey | null {
  const msg = message.toLowerCase();
  if (msg.includes("mobile")) return "mobile_number";
  if (msg.includes("postal")) return "postal_code";
  if (msg.includes("gender")) return "gender";
  if (msg.includes("street")) return "street_address";
  if (msg.includes("barangay")) return "barangay";
  if (msg.includes("province")) return "province";
  if (msg.includes("city")) return "city";
  return null;
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Last saved values: dirty-check and Cancel reset compare against this,
  // not the (potentially stale) initial prop. Resynced on every save.
  const [baseline, setBaseline] = useState<EditableBaseline>(() =>
    snapshotOf(initial),
  );
  const submitAttemptedRef = useRef(false);
  const discardModal = useOverlayState();
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const fieldsDirty =
    mobileNumber !== baseline.mobile_number ||
    gender !== baseline.gender ||
    streetAddress !== baseline.street_address ||
    barangay !== baseline.barangay ||
    city !== baseline.city ||
    province !== baseline.province ||
    postalCode !== baseline.postal_code;
  const isPristine =
    !fieldsDirty && stagedAvatar === null && stagedBackground === null;

  // Return to view mode after a successful save. Render-phase adjustment on the
  // new state object identity (one per completed submission), so repeat saves
  // with an identical message still transition. When a redirect target is set,
  // show the success modal instead — closing it routes away. Toast feedback
  // lives in the effect below (side effects don't belong in render).
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.success) {
      if (successRedirectHref) {
        setShowSuccessModal(true);
      } else {
        // Resync the baseline so Cancel/dirty-checks never revert to
        // pre-save data, and store the normalized mobile that was saved.
        const savedMobile = normalizeMobileNumber(mobileNumber);
        setMobileNumber(savedMobile);
        setBaseline({
          gender,
          mobile_number: savedMobile,
          street_address: streetAddress,
          barangay,
          city,
          province,
          postal_code: postalCode,
        });
        setMode("view");
      }
    } else if (state?.error) {
      const field = fieldForBackendError(state.error);
      if (field) {
        setErrors((prev) =>
          prev[field] ? prev : { ...prev, [field]: state.error as string },
        );
      }
    }
  }

  // Exactly one success feedback per save: dialog for the redirect flow,
  // toast otherwise. Generic backend errors get a sticky toast; field-mapped
  // ones render inline via the transition above.
  useEffect(() => {
    if (state?.success && !successRedirectHref) {
      toast.success(state.success, { timeout: 3500 });
    } else if (state?.error && !fieldForBackendError(state.error)) {
      toast.danger(state.error, { timeout: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Move focus to the first editable field when entering edit mode.
  useEffect(() => {
    if (mode === "edit") mobileInputRef.current?.focus();
  }, [mode]);

  // Browser-level unsaved-changes guard (tab close/refresh). In-app route
  // changes can't be intercepted in App Router, so Cancel/Escape go through
  // the confirm modal instead.
  useEffect(() => {
    if (mode !== "edit" || isPristine) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [mode, isPristine]);

  const handleSuccessClose = () => {
    if (successRedirectHref) router.push(successRedirectHref);
  };

  const handleEdit = () => {
    setErrors({});
    submitAttemptedRef.current = false;
    setMode("edit");
  };

  const resetToBaseline = () => {
    setMobileNumber(baseline.mobile_number);
    setPostalCode(baseline.postal_code);
    setGender(baseline.gender);
    setProvince(baseline.province);
    setStreetAddress(baseline.street_address);
    setBarangay(baseline.barangay);
    setCity(baseline.city);
    setStagedAvatar(null);
    setStagedBackground(null);
    photosCommittedRef.current = false;
    setErrors({});
    submitAttemptedRef.current = false;
    setPhotoError(null);
  };

  const doCancel = () => {
    discardModal.setOpen(false);
    resetToBaseline();
    setMode("view");
  };

  const handleCancelRequest = () => {
    if (isPending || isUploadingPhotos) return;
    if (isPristine) {
      resetToBaseline();
      setMode("view");
    } else {
      discardModal.open();
    }
  };

  // Escape behaves like Cancel. Overlays (Select popovers, modals) handle
  // Escape themselves and mark the event handled, so ignore those presses.
  // They also render in portals outside the form element, so a DOM
  // containment check keeps their key presses out even though React events
  // bubble through the component tree. Attached to the form so it works
  // from anywhere inside the edit card.
  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    const target = e.target as HTMLElement | null;
    if (!target || !formRef.current?.contains(target)) return;
    e.preventDefault();
    handleCancelRequest();
  };

  const handleAvatarSelect = (file: File | null) => {
    setStagedAvatar(file);
    photosCommittedRef.current = false;
  };

  const handleBackgroundSelect = (file: File | null) => {
    setStagedBackground(file);
    photosCommittedRef.current = false;
  };

  const valueForKey = (key: FieldKey, override?: string): string => {
    switch (key) {
      case "gender":
        return override ?? gender;
      case "mobile_number":
        return override ?? mobileNumber;
      case "street_address":
        return override ?? streetAddress;
      case "barangay":
        return override ?? barangay;
      case "city":
        return override ?? city;
      case "province":
        return override ?? province;
      case "postal_code":
        return override ?? postalCode;
    }
  };

  // Mirrors the update-profile action rules (including the postal 1000–9999
  // range and gender whitelist the old client check was missing), plus the
  // +639 mobile form normalized before submit.
  const validateField = (key: FieldKey, override?: string): string => {
    const value = valueForKey(key, override).trim();
    switch (key) {
      case "gender":
        if (!value) return "Gender is required.";
        if (!GENDERS.includes(value)) return "Invalid gender.";
        return "";
      case "mobile_number": {
        if (!value) return "Mobile number is required.";
        if (!/^09\d{9}$/.test(normalizeMobileNumber(value)))
          return "Enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).";
        return "";
      }
      case "street_address":
        return value ? "" : "Street address is required.";
      case "barangay":
        return value ? "" : "Barangay is required.";
      case "city":
        return value ? "" : "City is required.";
      case "province":
        return value ? "" : "Province is required.";
      case "postal_code": {
        if (!value) return "Postal code is required.";
        if (!/^\d{4}$/.test(value)) return "Must be 4 digits.";
        const numeric = Number(value);
        if (numeric < 1000 || numeric > 9999)
          return "Postal code must be between 1000 and 9999.";
        return "";
      }
    }
  };

  const setFieldError = (key: FieldKey, message: string) =>
    setErrors((prev) => {
      if (!message) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev[key] === message ? prev : { ...prev, [key]: message };
    });

  // Re-validate a field as the user types, but only once its error is
  // already visible (blur or a blocked submit) — no premature red text.
  const revalidateIfShown = (key: FieldKey, value: string) => {
    setErrors((prev) => {
      if (!prev[key] && !submitAttemptedRef.current) return prev;
      const message = validateField(key, value);
      if (!message) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev[key] === message ? prev : { ...prev, [key]: message };
    });
  };

  const handleBlur = (key: FieldKey) => setFieldError(key, validateField(key));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const next: Record<string, string> = {};
    for (const key of FIELD_KEYS) {
      const message = validateField(key);
      if (message) next[key] = message;
    }
    setErrors(next);
    submitAttemptedRef.current = true;
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

  const displayName =
    fullName || initial.email || "User";

  if (mode === "view") {
    return (
      <div className="flex flex-col gap-6">
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

        <div className="grid gap-6 md:grid-cols-2">
          <section className="flex min-w-0 flex-col gap-4">
            <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
              <IconId
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              Personal Information
            </h3>
            <div className="flex flex-col gap-4">
              <SummaryRow label="Full Name" value={fullName} />
              <SummaryRow
                label="Birth Date"
                value={formatBirthDate(initial.birth_date)}
              />
              <SummaryRow label="Gender" value={gender} />
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-4">
            <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
              <IconPhone
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              Contact
            </h3>
            <div className="flex flex-col gap-4">
              <SummaryRow label="Email Address" value={initial.email ?? ""} />
              <SummaryRow label="Mobile Number" value={mobileNumber} />
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-4 border-t border-border pt-6 md:col-span-2">
            <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
              <IconMapPin
                size={20}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
              Address
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0 md:col-span-2">
                <SummaryRow label="Street Address" value={streetAddress} />
              </div>
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
      onKeyDown={handleCardKeyDown}
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
          <input
            type="hidden"
            name="mobile_number"
            value={normalizeMobileNumber(mobileNumber)}
          />
          <TextField
            isRequired
            fullWidth
            value={mobileNumber}
            onChange={(val: string) => {
              const cleaned = val.startsWith("+")
                ? `+${val.slice(1).replace(/\D/g, "").slice(0, 12)}`
                : val.replace(/\D/g, "").slice(0, 11);
              setMobileNumber(cleaned);
              revalidateIfShown("mobile_number", cleaned);
            }}
            onBlur={() => handleBlur("mobile_number")}
            isInvalid={!!errors.mobile_number}
          >
            <Label>Mobile Number</Label>
            <Input
              ref={mobileInputRef}
              inputMode="tel"
              placeholder="09XXXXXXXXX or +639XXXXXXXXX"
              className="bg-card! text-foreground!"
            />
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
                const next = key ? String(key) : "";
                setGender(next);
                revalidateIfShown("gender", next);
              }}
              onBlur={() => handleBlur("gender")}
              isInvalid={!!errors.gender}
            >
              <Label>Gender</Label>
              <Select.Trigger className="bg-card! text-foreground!">
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
              revalidateIfShown("street_address", val);
            }}
            onBlur={() => handleBlur("street_address")}
            isInvalid={!!errors.street_address}
          >
            <Label>Street Address</Label>
            <Input placeholder="Enter your street address" className="bg-card! text-foreground!" />
            <FieldError>{errors.street_address}</FieldError>
          </TextField>

          <TextField
            name="barangay"
            isRequired
            fullWidth
            value={barangay}
            onChange={(val: string) => {
              setBarangay(val);
              revalidateIfShown("barangay", val);
            }}
            onBlur={() => handleBlur("barangay")}
            isInvalid={!!errors.barangay}
          >
            <Label>Barangay</Label>
            <Input placeholder="Enter your barangay" className="bg-card! text-foreground!" />
            <FieldError>{errors.barangay}</FieldError>
          </TextField>

          <TextField
            name="city"
            isRequired
            fullWidth
            value={city}
            onChange={(val: string) => {
              setCity(val);
              revalidateIfShown("city", val);
            }}
            onBlur={() => handleBlur("city")}
            isInvalid={!!errors.city}
          >
            <Label>City</Label>
            <Input placeholder="Enter your city" className="bg-card! text-foreground!" />
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
                const next = key ? String(key) : "";
                setProvince(next);
                revalidateIfShown("province", next);
              }}
              onBlur={() => handleBlur("province")}
              isInvalid={!!errors.province}
            >
              <Label>Province</Label>
              <Select.Trigger className="bg-card! text-foreground!">
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
              const cleaned = val.replace(/\D/g, "").slice(0, 4);
              setPostalCode(cleaned);
              revalidateIfShown("postal_code", cleaned);
            }}
            onBlur={() => handleBlur("postal_code")}
            isInvalid={!!errors.postal_code}
          >
            <Label>Postal Code</Label>
            <Input
              placeholder="Enter your postal code"
              inputMode="numeric"
              maxLength={4}
              className="bg-card! text-foreground!"
            />
            <FieldError>{errors.postal_code}</FieldError>
          </TextField>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto font-semibold"
          onPress={handleCancelRequest}
          isDisabled={isPending || isUploadingPhotos}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto font-semibold"
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
      </div>

      <Modal isOpen={discardModal.isOpen} onOpenChange={discardModal.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Discard changes?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">
                  Your unsaved changes will be lost if you leave now. Are you
                  sure you want to cancel?
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => discardModal.setOpen(false)}
                >
                  Keep Editing
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  onPress={doCancel}
                >
                  Discard
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </form>
  );
}
