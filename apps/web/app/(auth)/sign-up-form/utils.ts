import { SignUpFormData } from "./types";
import { validateBirthDate } from "@/lib/birth-date";
import {
  GENDERS,
  PASSWORD_POLICY_MESSAGE,
  meetsPasswordPolicy,
  validatePHMobile,
} from "@repo/constants";
import { validateRegistrationAddress } from "@/lib/registration-address";

export function validateForm(formData: SignUpFormData): string | null {
  return validateSignUpForm(formData)?.message ?? null;
}

export function validateSignUpForm(formData: SignUpFormData): { field?: "birthDate"; message: string } | null {
  const birthDateError = validateBirthDate(formData.birthDate);
  if (birthDateError) return { field: "birthDate", message: birthDateError };
  const error = validateOtherFields(formData);
  return error ? { message: error } : null;
}

function validateOtherFields(formData: SignUpFormData): string | null {
  if (!formData.firstName || !formData.lastName) {
    return "First name and last name are required.";
  }

  if (!formData.password || !formData.confirmPassword) {
    return "Password and confirm password are required.";
  }

  if (!meetsPasswordPolicy(formData.password)) {
    return PASSWORD_POLICY_MESSAGE;
  }

  if (formData.password !== formData.confirmPassword) {
    return "Passwords do not match.";
  }

  if (!formData.gender || !formData.mobileNumber) {
    return "Gender and mobile number are required.";
  }

  const addressErrors = validateRegistrationAddress({
    province: formData.stateProvince, city: formData.city, barangay: formData.barangay,
    streetAddress: formData.streetAddress, postalCode: formData.postalCode === undefined ? "" : String(formData.postalCode),
  });
  const addressError = Object.values(addressErrors)[0];
  if (addressError) return addressError;

  if (!GENDERS.includes(formData.gender)) {
    return "Please choose a valid gender.";
  }

  const mobileError = validatePHMobile(formData.mobileNumber).errorMessage;
  if (mobileError) {
    return mobileError;
  }

  return null;
}
