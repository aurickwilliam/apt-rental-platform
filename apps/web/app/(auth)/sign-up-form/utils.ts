import { SignUpFormData } from "./types";

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

  const parsedBirthDate = new Date(`${formData.birthDate}T00:00:00`);
  if (Number.isNaN(parsedBirthDate.getTime()) || parsedBirthDate > new Date()) {
    return "Please enter a valid birth date.";
  }

  const today = new Date();
  let age = today.getFullYear() - parsedBirthDate.getFullYear();
  const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate())
  ) {
    age -= 1;
  }
  if (age < 0 || age > 120) {
    return "Please enter a valid birth date.";
  }

  if (
    formData.postalCode === undefined ||
    Number.isNaN(Number(formData.postalCode))
  ) {
    return "Please enter a valid postal code.";
  }

  return null;
}