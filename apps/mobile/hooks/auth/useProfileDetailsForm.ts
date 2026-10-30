import { useRef, useState, type RefObject } from "react";
import type { LayoutChangeEvent } from "react-native";

import { getBarangaysByCity, getCitiesByProvince } from "@repo/constants";
import { usePHMobileValidation, usePHPostalCode } from "@repo/hooks";
import { validateBirthDate } from "@repo/utils";

import type { ScreenWrapperScrollRef } from "components/layout/ScreenWrapper";

// The personal + address details collected by both profile screens: the
// sign-up one (new email account) and the finish-profile one (account that
// already exists). Mobile number and postal code live in their own shared
// validation hooks; the screens add whatever is theirs (passwords, role).

export type ProfileDetailsField =
  | "firstName"
  | "lastName"
  | "middleName"
  | "suffixName"
  | "gender"
  | "birthDate"
  | "province"
  | "city"
  | "barangay"
  | "streetAddress";

export type ProfileDetailsValues = Record<ProfileDetailsField, string>;

// Everything the screen can scroll to when submit finds an error, top to bottom.
export type ProfileScrollTarget =
  | ProfileDetailsField
  | "mobileNumber"
  | "postalCode"
  | "password"
  | "confirmPassword";

const REQUIRED_FIELDS: ProfileDetailsField[] = [
  "firstName",
  "lastName",
  "gender",
  "birthDate",
  "province",
  "city",
  "barangay",
  "streetAddress",
];

const SCROLL_ORDER: ProfileScrollTarget[] = [
  "firstName",
  "lastName",
  "gender",
  "birthDate",
  "mobileNumber",
  "province",
  "city",
  "barangay",
  "streetAddress",
  "postalCode",
  "password",
  "confirmPassword",
];

// Space kept above the first invalid field when scrolling to it.
const SCROLL_TOP_MARGIN = 16;

// The `users` columns written from these details (profile insert or update).
export interface ProfileDetailsRow {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  gender: string;
  birth_date: string;
  mobile_number: string;
  province: string;
  city: string;
  barangay: string;
  postal_code: number | null;
  street_address: string;
}

interface ProfileDetailsOptions {
  firstName?: string;
  lastName?: string;
  // The screen's scroll view (`ScreenWrapper scrollable`), so a failed submit
  // can scroll to the first invalid field. Owned by the screen, not the form.
  scrollRef: RefObject<ScreenWrapperScrollRef | null>;
}

export function useProfileDetailsForm({ firstName, lastName, scrollRef }: ProfileDetailsOptions) {
  const [values, setValues] = useState<ProfileDetailsValues>({
    firstName: firstName ?? "",
    lastName: lastName ?? "",
    middleName: "",
    suffixName: "",
    gender: "",
    birthDate: "",
    province: "",
    city: "",
    barangay: "",
    streetAddress: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const positions = useRef<Partial<Record<ProfileScrollTarget, number>>>({});

  const postal = usePHPostalCode({ city: values.city, province: values.province });
  const mobile = usePHMobileValidation();

  const setField = (field: ProfileDetailsField, value: string | null) => {
    setValues((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  // Changing a parent level clears the levels under it.
  const setProvince = (province: string | null) => {
    setValues((prev) => ({ ...prev, province: province ?? "", city: "", barangay: "" }));
  };

  const setCity = (city: string | null) => {
    setValues((prev) => ({ ...prev, city: city ?? "", barangay: "" }));
  };

  const cityOptions = values.province
    ? getCitiesByProvince(values.province as Parameters<typeof getCitiesByProvince>[0])
    : [];
  const barangayOptions = values.city ? getBarangaysByCity(values.city, values.province) : [];

  // The error for a field, once the user has tried to submit. The birth date
  // is also checked live (same rule as web and the database: 18+, not in the
  // future, not over 120).
  const getError = (field: ProfileDetailsField): string | undefined => {
    if (submitted && REQUIRED_FIELDS.includes(field) && !values[field].trim()) {
      return "This field is required";
    }

    if (field === "birthDate" && values.birthDate) {
      return validateBirthDate(values.birthDate) ?? undefined;
    }

    return undefined;
  };

  // Spread on the wrapper of a field so a failed submit can scroll to it.
  const trackPosition = (target: ProfileScrollTarget) => ({
    onLayout: (event: LayoutChangeEvent) => {
      positions.current[target] = event.nativeEvent.layout.y;
    },
  });

  const mobileNumber = mobile.validation.formattedNumber ?? mobile.value;

  // Checks every field, shows all errors and scrolls to the first one.
  // `extraInvalid` carries the screen's own invalid fields (passwords).
  const validate = (extraInvalid: ProfileScrollTarget[] = []): boolean => {
    setSubmitted(true);

    const invalid = new Set<ProfileScrollTarget>(extraInvalid);
    for (const field of REQUIRED_FIELDS) {
      if (!values[field].trim()) invalid.add(field);
    }
    if (values.birthDate && validateBirthDate(values.birthDate)) invalid.add("birthDate");
    if (!postal.validate()) invalid.add("postalCode");
    if (!mobile.validate().isValid) invalid.add("mobileNumber");

    const firstInvalid = SCROLL_ORDER.find((target) => invalid.has(target));
    if (!firstInvalid) return true;

    const y = positions.current[firstInvalid];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ x: 0, y: Math.max(y - SCROLL_TOP_MARGIN, 0), animated: true });
    }
    return false;
  };

  const toRow = (): ProfileDetailsRow => ({
    first_name: values.firstName,
    last_name: values.lastName,
    middle_name: values.middleName || null,
    suffix: values.suffixName || null,
    gender: values.gender,
    birth_date: values.birthDate,
    mobile_number: mobileNumber,
    province: values.province,
    city: values.city,
    barangay: values.barangay,
    postal_code: postal.value ? parseInt(postal.value, 10) : null,
    street_address: values.streetAddress,
  });

  return {
    values,
    postalCode: postal.value,
    mobileNumber,
    setField,
    setProvince,
    setCity,
    cityOptions,
    barangayOptions,
    getError,
    postal: {
      value: postal.value,
      error: postal.error,
      onChange: postal.handleChange,
      onBlur: postal.handleBlur,
    },
    mobile: {
      value: mobile.value,
      errorMessage: mobile.validation.errorMessage,
      onChange: mobile.onChange,
    },
    trackPosition,
    submitted,
    validate,
    toRow,
  };
}

export type ProfileDetailsForm = ReturnType<typeof useProfileDetailsForm>;
