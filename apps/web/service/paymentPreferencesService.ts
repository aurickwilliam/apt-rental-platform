"use client";

import { createClient } from "@repo/supabase/browser";

import type { PaymentMethod, PaymentMethodPreference } from "@/app/tenant/payment/types";

type PaymentPreferenceRow = {
  saved_methods: string[];
  default_method: string | null;
};

const methodByDatabaseValue: Record<string, PaymentMethod> = {
  gcash: "GCash",
  maya: "Maya",
  qrph: "QRPh",
  card: "Debit/Credit-Card",
  cash: "Cash",
};

const databaseValueByMethod: Record<PaymentMethod, string> = {
  GCash: "gcash",
  Maya: "maya",
  QRPh: "qrph",
  "Debit/Credit-Card": "card",
  Cash: "cash",
};

function fromRow(row: PaymentPreferenceRow | null): PaymentMethodPreference {
  const savedMethods = (row?.saved_methods ?? []).flatMap((method) => {
    const mapped = methodByDatabaseValue[method];
    return mapped ? [mapped] : [];
  });
  const defaultMethod = row?.default_method ? methodByDatabaseValue[row.default_method] ?? null : null;

  return {
    savedMethods,
    defaultMethod: defaultMethod && savedMethods.includes(defaultMethod) ? defaultMethod : null,
  };
}

export async function fetchPaymentMethodPreferences(userId: string): Promise<PaymentMethodPreference> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_method_preferences")
    .select("saved_methods, default_method")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return fromRow(data as PaymentPreferenceRow | null);
}

export async function savePaymentMethodPreferences(
  userId: string,
  preferences: PaymentMethodPreference,
): Promise<PaymentMethodPreference> {
  const savedMethods = [...new Set(preferences.savedMethods)];
  const defaultMethod = preferences.defaultMethod && savedMethods.includes(preferences.defaultMethod)
    ? preferences.defaultMethod
    : null;
  const supabase = createClient();

  if (savedMethods.length === 0) {
    const { error } = await supabase.from("payment_method_preferences").delete().eq("user_id", userId);
    if (error) throw error;
    return { savedMethods: [], defaultMethod: null };
  }

  const row = {
    saved_methods: savedMethods.map((method) => databaseValueByMethod[method]),
    default_method: defaultMethod ? databaseValueByMethod[defaultMethod] : null,
  };
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
  return fromRow(data as PaymentPreferenceRow);
}
