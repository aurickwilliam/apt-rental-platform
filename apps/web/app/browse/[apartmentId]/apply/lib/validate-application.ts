import { isValidEmail } from "@repo/utils";
import {
  validatePHMobile as validatePHMobileNumber,
  REQUIRES_COMPANY_NAME_TYPES,
  REQUIRES_OCCUPATION_TYPES,
  requiresProofOfIncome,
  type EmploymentType,
} from "@repo/constants";
import type { TranslateVars, TranslationKey } from "@repo/i18n";

import type { ApplicationErrors, ApplicationForm } from "../types";

/** Translates a catalog key with the wizard's locale. */
export type Translate = (key: TranslationKey, vars?: TranslateVars) => string;

// Optional field: blank passes, anything typed follows the shared rule.
export function validatePHMobile(input: string): { isValid: boolean; errorMessage?: string } {
  if (!input.trim()) return { isValid: true };
  const { isValid, errorMessage } = validatePHMobileNumber(input);
  return { isValid, errorMessage: errorMessage ?? undefined };
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
export function validateTenantInfo(form: ApplicationForm, t: Translate): ApplicationErrors {
  const next: ApplicationErrors = {};
  const { isNoIncomeType, requiresOccupation, requiresCompany } = employmentRules(form.employmentType);

  if (!form.fullName.trim()) next.fullName = t("apply.error.fullName");
  if (!form.email.trim()) next.email = t("apply.error.emailRequired");
  else if (!isValidEmail(form.email.trim())) next.email = t("apply.error.emailInvalid");
  if (!form.dateOfBirth) next.dateOfBirth = t("apply.error.birthDateRequired");
  else {
    const date = new Date(form.dateOfBirth);
    if (Number.isNaN(date.getTime())) next.dateOfBirth = t("apply.error.birthDateInvalid");
    else if (date > new Date()) next.dateOfBirth = t("apply.error.birthDateFuture");
  }
  if (!form.contactNumber.trim()) next.contactNumber = t("apply.error.contactRequired");
  else {
    const result = validatePHMobile(form.contactNumber);
    if (!result.isValid) next.contactNumber = result.errorMessage ?? t("apply.error.contactInvalid");
  }
  if (!form.currentAddress.trim()) next.currentAddress = t("apply.error.addressRequired");
  if (!form.employmentType.trim()) next.employmentType = t("apply.error.employmentTypeRequired");
  if (requiresOccupation && !form.occupation.trim()) next.occupation = t("apply.error.occupationRequired");
  if (requiresCompany && !form.companyName.trim()) next.companyName = t("apply.error.companyRequired");
  if (form.monthlyIncome === null || Number.isNaN(form.monthlyIncome)) next.monthlyIncome = t("apply.error.incomeRequired");
  else if (form.monthlyIncome < 0) next.monthlyIncome = t("apply.error.incomeNegative");
  else if (!isNoIncomeType && form.monthlyIncome === 0) next.monthlyIncome = t("apply.error.incomeRequired");

  const hasName = form.prevLandlordName.trim().length > 0;
  const hasContact = form.prevLandlordContact.trim().length > 0;
  if (hasContact) {
    const result = validatePHMobile(form.prevLandlordContact);
    if (!result.isValid) next.prevLandlordContact = result.errorMessage ?? t("apply.error.contactInvalid");
  }
  if (hasName && !hasContact) next.prevLandlordContact = t("apply.error.prevContactRequired");
  if (!hasName && hasContact) next.prevLandlordName = t("apply.error.prevNameRequired");

  return withoutEmpty(next);
}

/** Rental preferences step; returns only the failing fields. */
export function validatePreferences(form: ApplicationForm, maxOccupants: number | null, t: Translate): ApplicationErrors {
  const next: ApplicationErrors = {};

  if (!form.moveInDate) next.moveInDate = t("apply.error.moveInRequired");
  else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const picked = new Date(form.moveInDate);
    picked.setHours(0, 0, 0, 0);
    if (picked < today) next.moveInDate = t("apply.error.moveInPast");
    else if (picked.getTime() === today.getTime()) next.moveInDate = t("apply.error.moveInToday");
  }

  const occupants = parseInt(form.noOccupants, 10);
  if (!form.noOccupants || Number.isNaN(occupants) || occupants <= 0) {
    next.noOccupants = t("apply.error.occupantsInvalid");
  } else if (maxOccupants !== null && occupants > maxOccupants) {
    next.noOccupants = t("apply.error.occupantsTooMany", { count: maxOccupants });
  }
  if (!form.hasPets) next.hasPets = t("apply.error.hasPetsRequired");
  if (!form.isSmoker) next.isSmoker = t("apply.error.smokerRequired");
  if (!form.needParking) next.needParking = t("apply.error.parkingRequired");

  return withoutEmpty(next);
}
