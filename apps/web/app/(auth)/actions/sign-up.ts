"use server";

import { createClient } from "@repo/supabase/server";
import { validateSignUpForm } from "../sign-up-form/utils";
import { SignUpFormData } from "../sign-up-form/types";
import { SUFFIXES, validatePHMobile } from "@repo/constants";
import { getBirthDateDatabaseError } from "@/lib/birth-date";
import { getRegistrationAcceptanceErrors, readRegistrationAcceptance, validateRegistrationAcceptance, type AcceptanceErrors } from "@/lib/registration-policies";
import { completeWebRegistration } from "@/service/registrationService";

export interface SignUpFormState {
  error: string | null;
  success: boolean;
  birthDateError?: string;
  birthDate?: string;
  acceptanceErrors?: AcceptanceErrors;
}

export async function signUp(
  _prevState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  try {
    const mapped: SignUpFormData = {
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      middleName: formData.get("middleName") as string,
      suffix: (formData.get("suffix") as string | null) ?? "",
      birthDate: formData.get("birthDate") as string,
      gender: formData.get("gender") as string,
      mobileNumber: formData.get("mobileNumber") as string,
      streetAddress: formData.get("streetAddress") as string,
      barangay: formData.get("barangay") as string,
      city: formData.get("city") as string,
      stateProvince: formData.get("stateProvince") as string,
      postalCode: Number(formData.get("postalCode")) || undefined,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validationError = validateSignUpForm(mapped);
    if (validationError?.field === "birthDate") return { error: null, success: false, birthDateError: validationError.message, birthDate: mapped.birthDate ?? "" };
    if (validationError) {
      return { error: validationError.message, success: false };
    }

    const userId = formData.get("userId") as string;
    if (!userId) {
      return {
        error: "Session not found. Please try verifying your email again.",
        success: false,
      };
    }

    const requestedRole = formData.get("role");
    if (requestedRole !== "tenant" && requestedRole !== "landlord") {
      return { error: "Please choose a valid account type.", success: false };
    }

    const parsedPostalCode = mapped.postalCode ?? null;
    const acceptance = readRegistrationAcceptance(formData);
    const acceptanceErrors = validateRegistrationAcceptance(acceptance);
    if (Object.keys(acceptanceErrors).length) return { error: null, success: false, acceptanceErrors };

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId || !user.email) {
      return { error: "Session not found. Please verify your email again.", success: false };
    }

    const mobile = validatePHMobile(mapped.mobileNumber);
    if (!mobile.formattedNumber) return { error: mobile.errorMessage ?? "Enter a valid mobile number.", success: false };
    const profileDetails = {
      first_name: mapped.firstName,
      last_name: mapped.lastName,
      middle_name: mapped.middleName || null,
      suffix: SUFFIXES.includes(mapped.suffix) ? mapped.suffix : null,
      gender: mapped.gender,
      // The shared validator normalizes both allocated 08 and 09 blocks.
      mobile_number: mobile.formattedNumber,
      birth_date: mapped.birthDate,
      street_address: mapped.streetAddress,
      barangay: mapped.barangay,
      city: mapped.city,
      province: mapped.stateProvince,
      postal_code: parsedPostalCode,
    };
    const { error: insertError } = await completeWebRegistration(supabase, profileDetails, requestedRole, acceptance, "web_registration");

    if (insertError) {
      const acceptanceErrors = getRegistrationAcceptanceErrors(insertError);
      if (acceptanceErrors) return { error: null, success: false, acceptanceErrors };
      const birthDateError = getBirthDateDatabaseError(insertError);
      if (birthDateError) return { error: null, success: false, birthDateError, birthDate: mapped.birthDate };
      if (insertError.code === "23505") {
        return {
          error: "An account with this email already exists. Please sign in instead.",
          success: false,
        };
      }
      return {
        error: "We could not create your account profile. Please check your details and try again.",
        success: false,
      };
    }

    return { error: null, success: true };

  } catch (error) {
    console.error("Unexpected error during sign-up", { name: error instanceof Error ? error.name : "UnknownError" });
    return {
      error: "An unexpected error occurred. Please try again later.",
      success: false,
    };
  }
}
