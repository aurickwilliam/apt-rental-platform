"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@repo/supabase/browser";
import { signUp } from "../../actions/sign-up";
import { sendEmailOtp } from "../../actions/send-otp";
import { SignUpFormData } from "../types";

const OTP_COOLDOWN = 120;

interface UseOtpFlowOptions {
  formData: SignUpFormData;
  role: string;
  showError: (msg: string) => void;
  onSuccessOpen: () => void;
}

export function useOtpFlow({
  formData,
  role,
  showError,
  onSuccessOpen,
}: UseOtpFlowOptions) {
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(OTP_COOLDOWN);

    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError(null);
    try {
      const result = await sendEmailOtp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      );
      if (result.error) {
        setOtpError(result.error);
        return;
      }
      setOtp("");
      startCooldown();
    } catch {
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (onClose: () => void) => {
    setLoading(true);
    setOtpError(null);

    try {
      const supabase = createClient();
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: "signup",
      });

      if (otpError || !data.user) {
        setOtpError("Invalid or expired code. Please try again.");
        return;
      }

      const fd = new FormData();
      fd.set("userId", data.user.id);
      fd.set("email", formData.email);
      fd.set("firstName", formData.firstName);
      fd.set("lastName", formData.lastName);
      fd.set("middleName", formData.middleName);
      fd.set("birthDate", formData.birthDate);
      fd.set("gender", formData.gender);
      fd.set("mobileNumber", formData.mobileNumber);
      fd.set("streetAddress", formData.streetAddress);
      fd.set("barangay", formData.barangay);
      fd.set("city", formData.city);
      fd.set("stateProvince", formData.stateProvince);
      fd.set("postalCode", formData.postalCode?.toString() ?? "");
      fd.set("password", formData.password);
      fd.set("confirmPassword", formData.confirmPassword);
      fd.set("role", role);

      const result = await signUp({ error: null, success: false }, fd);

      if (result.error) {
        showError(result.error);
        onClose();
      } else if (result.success) {
        onClose();
        onSuccessOpen();
      }
    } catch (err) {
      console.error("Caught error:", err);
      setOtpError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOtp = async (onClose: () => void) => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOtp("");
    setOtpError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(0);
    onClose();
  };

  return {
    otp,
    setOtp,
    otpError,
    setOtpError,
    resendCooldown,
    resendLoading,
    loading,
    startCooldown,
    formatCooldown,
    handleResendOtp,
    handleVerifyOtp,
    handleCancelOtp,
  };
}