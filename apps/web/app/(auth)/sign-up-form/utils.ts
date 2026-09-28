import { SignUpFormData } from "./types";
import { validateBirthDate } from "@/lib/birth-date";

export function validateForm(formData: SignUpFormData): string | null {
  if (!formData.firstName || !formData.lastName) {
    return "First name and last name are required.";
  }

  if (!formData.password || !formData.confirmPassword) {
    return "Password and confirm password are required.";
  }

  if (formData.password.length < 8) {
    return "Password must be at least 8 characters long.";
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

  if (
    formData.postalCode === undefined ||
    Number.isNaN(Number(formData.postalCode))
  ) {
    return "Please enter a valid postal code.";
  }

  return null;
}