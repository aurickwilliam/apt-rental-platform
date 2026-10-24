import { SignUpFormData } from "./types";
import { validateBirthDate } from "@/lib/birth-date";
import {
  GENDERS,
  PASSWORD_POLICY_MESSAGE,
  isZipPlausibleForCity,
  meetsPasswordPolicy,
  validatePHMobile,
} from "@repo/constants";

export function validateForm(formData: SignUpFormData): string | null {
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

  if (!formData.birthDate || !formData.gender || !formData.mobileNumber) {
    return "Birth date, gender, and mobile number are required.";
  }

  if (
    !formData.streetAddress ||
    !formData.barangay ||
    !formData.city ||
    !formData.stateProvince ||
    !formData.postalCode
  ) {
    return "Complete address information is required.";
  }

  const birthDateError = validateBirthDate(formData.birthDate);
  if (birthDateError) {
    return birthDateError;
  }

  if (!GENDERS.includes(formData.gender)) {
    return "Please choose a valid gender.";
  }

  const mobileError = validatePHMobile(formData.mobileNumber).errorMessage;
  if (mobileError) {
    return mobileError;
  }

  if (
    formData.postalCode === undefined ||
    Number.isNaN(Number(formData.postalCode))
  ) {
    return "Please enter a valid postal code.";
  }

  if (
    !isZipPlausibleForCity(
      formData.city,
      formData.stateProvince,
      String(formData.postalCode),
    )
  ) {
    return `Enter a valid postal code for ${formData.city}.`;
  }

  return null;
}