import { isValidEmail } from "@repo/utils";
import {
  REQUIRES_COMPANY_NAME_TYPES,
  REQUIRES_OCCUPATION_TYPES,
  requiresProofOfIncome,
  type EmploymentType,
} from "@repo/constants";

import type { ApplicationErrors, ApplicationForm } from "../types";

export function validatePHMobile(input: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { isValid: true };
  const digits = trimmed.replace(/[\s\-().]/g, "");
  let normalized = digits;
  if (/^\+639\d{9}$/.test(digits)) normalized = "0" + digits.slice(3);
  else if (/^639\d{9}$/.test(digits)) normalized = "0" + digits.slice(2);
  else if (/^9\d{9}$/.test(digits)) normalized = "0" + digits;
  if (!/^09\d{9}$/.test(normalized)) {
    return { isValid: false, errorMessage: "Invalid format. Use 09XXXXXXXXX." };
  }
  return { isValid: true };
}

export function employmentRules(employmentType: string) {
  return {
    isNoIncomeType: !requiresProofOfIncome(employmentType || ""),
    requiresOccupation: REQUIRES_OCCUPATION_TYPES.includes(employmentType as EmploymentType),
    requiresCompany: REQUIRES_COMPANY_NAME_TYPES.includes(employmentType as EmploymentType),
  };
}

function withoutEmpty(errors: ApplicationErrors): ApplicationErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => !!message));
}

/** Tenant information step; returns only the failing fields. */
export function validateTenantInfo(form: ApplicationForm): ApplicationErrors {
  const next: ApplicationErrors = {};
  const { isNoIncomeType, requiresOccupation, requiresCompany } = employmentRules(form.employmentType);

  if (!form.fullName.trim()) next.fullName = "Full name is required.";
  if (!form.email.trim()) next.email = "Email is required.";
  else if (!isValidEmail(form.email.trim())) next.email = "Enter a valid email address.";
  if (!form.dateOfBirth) next.dateOfBirth = "Date of birth is required.";
  else {
    const date = new Date(form.dateOfBirth);
    if (Number.isNaN(date.getTime())) next.dateOfBirth = "Enter a valid date.";
    else if (date > new Date()) next.dateOfBirth = "Date of birth cannot be in the future.";
  }
  if (!form.contactNumber.trim()) next.contactNumber = "Contact number is required.";
  else {
    const result = validatePHMobile(form.contactNumber);
    if (!result.isValid) next.contactNumber = result.errorMessage ?? "Invalid contact number.";
  }
  if (!form.currentAddress.trim()) next.currentAddress = "Current address is required.";
  if (!form.employmentType.trim()) next.employmentType = "Employment type is required.";
  if (requiresOccupation && !form.occupation.trim()) next.occupation = "Occupation is required.";
  if (requiresCompany && !form.companyName.trim()) next.companyName = "Company name is required.";
  if (form.monthlyIncome === null || Number.isNaN(form.monthlyIncome)) next.monthlyIncome = "Monthly income is required.";
  else if (form.monthlyIncome < 0) next.monthlyIncome = "Monthly income cannot be negative.";
  else if (!isNoIncomeType && form.monthlyIncome === 0) next.monthlyIncome = "Monthly income is required.";

  const hasName = form.prevLandlordName.trim().length > 0;
  const hasContact = form.prevLandlordContact.trim().length > 0;
  if (hasContact) {
    const result = validatePHMobile(form.prevLandlordContact);
    if (!result.isValid) next.prevLandlordContact = result.errorMessage ?? "Invalid contact number.";
  }
  if (hasName && !hasContact) next.prevLandlordContact = "Contact number is required.";
  if (!hasName && hasContact) next.prevLandlordName = "Landlord name is required.";

  return withoutEmpty(next);
}

/** Rental preferences step; returns only the failing fields. */
export function validatePreferences(form: ApplicationForm, maxOccupants: number | null): ApplicationErrors {
  const next: ApplicationErrors = {};

  if (!form.moveInDate) next.moveInDate = "Please select your preferred move-in date.";
  else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(form.moveInDate);
    picked.setHours(0, 0, 0, 0);
    if (picked < today) next.moveInDate = "Move-in date cannot be in the past.";
    else if (picked.getTime() === today.getTime()) next.moveInDate = "Move-in date cannot be today.";
  }

  const occupants = parseInt(form.noOccupants, 10);
  if (!form.noOccupants || Number.isNaN(occupants) || occupants <= 0) {
    next.noOccupants = "Please enter a valid number of occupants.";
  } else if (maxOccupants !== null && occupants > maxOccupants) {
    next.noOccupants = `Please enter ${maxOccupants} or fewer occupants.`;
  }
  if (!form.hasPets) next.hasPets = "Please indicate if you have pets.";
  if (!form.isSmoker) next.isSmoker = "Please indicate if you are a smoker.";
  if (!form.needParking) next.needParking = "Please indicate if you need parking.";

  return withoutEmpty(next);
}
