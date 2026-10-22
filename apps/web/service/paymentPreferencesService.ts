"use client";

import { createClient } from "@repo/supabase/browser";

import { paymentMethodPreferencesFromRow, paymentMethodPreferencesToRow, type PaymentMethodPreference } from "@repo/utils";

export async function fetchPaymentMethodPreferences(userId: string): Promise<PaymentMethodPreference> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_method_preferences")
    .select("saved_methods, default_method")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return paymentMethodPreferencesFromRow(data);
}

export async function savePaymentMethodPreferences(
  userId: string,
  preferences: PaymentMethodPreference,
): Promise<PaymentMethodPreference> {
  const row = paymentMethodPreferencesToRow(preferences);
  const supabase = createClient();

  if (row.saved_methods.length === 0) {
    const { error } = await supabase.from("payment_method_preferences").delete().eq("user_id", userId);
    if (error) throw error;
    return { savedMethods: [], defaultMethod: null };
  }

  const { data: existing, error: existingError } = await supabase
    .from("payment_method_preferences")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  // Do not use upsert here. Its conflict path can require UPDATE permission on
  // the protected user_id column, and the INSERT path must not write updated_at.
  const request = existing
    ? supabase
        .from("payment_method_preferences")
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
    : supabase.from("payment_method_preferences").insert({ user_id: userId, ...row });
  const { data, error } = await request.select("saved_methods, default_method").single();

  if (error) throw error;
  return paymentMethodPreferencesFromRow(data);
}
