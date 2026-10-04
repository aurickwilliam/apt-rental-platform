"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { signUp } from "../../actions/sign-up";
import { sendEmailOtp } from "../../actions/send-otp";
import { SignUpFormData } from "../types";

const OTP_COOLDOWN = 120;

// One browser client for the whole OTP flow. createClient() is a cached
// singleton in @repo/supabase/browser, but hoisting it keeps the dependency
// explicit and avoids re-reading the client on every resend/verify.
const supabase = createClient();

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

  // Keeps handlers stable while still reading the latest values when fired.
  // Mirrored in an effect (not during render) to satisfy
  // react-hooks/set-state-in-effect / no-ref-write-in-render.
  const latest = useRef({ formData, role, showError, onSuccessOpen });
  const otpRef = useRef(otp);

  useEffect(() => {
    latest.current = { formData, role, showError, onSuccessOpen };
    otpRef.current = otp;
  }, [formData, role, showError, onSuccessOpen, otp]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
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
  }, []);

  const formatCooldown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleResendOtp = useCallback(async () => {
    const { formData: data } = latest.current;
    setResendLoading(true);
    setOtpError(null);
    try {
      const result = await sendEmailOtp(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
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
  }, [startCooldown]);

  const handleVerifyOtp = useCallback(async (onClose: () => void) => {
    const { formData: data, role: currentRole, showError: fail, onSuccessOpen: succeed } = latest.current;
    setLoading(true);
    setOtpError(null);

    try {
      const { data: session, error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: otpRef.current,
        type: "signup",
      });

      if (otpError || !session.user) {
        setOtpError("Invalid or expired code. Please try again.");
        return;
      }

      const fd = new FormData();
      fd.set("userId", session.user.id);
      fd.set("email", data.email);
      fd.set("firstName", data.firstName);
      fd.set("lastName", data.lastName);
      fd.set("middleName", data.middleName);
      fd.set("birthDate", data.birthDate);
      fd.set("gender", data.gender);
      fd.set("mobileNumber", data.mobileNumber);
      fd.set("streetAddress", data.streetAddress);
      fd.set("barangay", data.barangay);
      fd.set("city", data.city);
      fd.set("stateProvince", data.stateProvince);
      fd.set("postalCode", data.postalCode?.toString() ?? "");
      fd.set("password", data.password);
      fd.set("confirmPassword", data.confirmPassword);
      fd.set("role", currentRole);

      const result = await signUp({ error: null, success: false }, fd);

      if (result.error) {
        fail(result.error);
        onClose();
      } else if (result.success) {
        onClose();
        succeed();
      }
    } catch (err) {
      console.error("Caught error:", err);
      setOtpError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancelOtp = useCallback(async (onClose: () => void) => {
    await supabase.auth.signOut();
    setOtp("");
    setOtpError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(0);
    onClose();
  }, []);

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