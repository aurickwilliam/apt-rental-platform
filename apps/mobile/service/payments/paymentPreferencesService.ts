import { supabase } from "@repo/supabase";
import {
  paymentMethodPreferencesFromRow,
  paymentMethodPreferencesToRow,
  type PaymentMethodPreference,
} from "@repo/utils";

export async function fetchPaymentMethodPreferences(userId: string, signal?: AbortSignal): Promise<PaymentMethodPreference> {
  const query = supabase.from("payment_method_preferences")
    .select("saved_methods, default_method").eq("user_id", userId);
  if (signal) query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return paymentMethodPreferencesFromRow(data);
}

export async function savePaymentMethodPreferences(userId: string, preferences: PaymentMethodPreference): Promise<PaymentMethodPreference> {
  const row = paymentMethodPreferencesToRow(preferences);
  if (row.saved_methods.length === 0) {
    const { error } = await supabase.from("payment_method_preferences").delete().eq("user_id", userId);
    if (error) throw error;
    return paymentMethodPreferencesFromRow(null);
  }

  const { data: existing, error: lookupError } = await supabase.from("payment_method_preferences")
    .select("user_id").eq("user_id", userId).maybeSingle();
  if (lookupError) throw lookupError;

  // Match Web's column-scoped grants: upsert would require UPDATE(user_id).
  // Only UPDATE may include updated_at; INSERT writes method names and owner only.
  const request = existing
    ? supabase.from("payment_method_preferences").update({ ...row, updated_at: new Date().toISOString() }).eq("user_id", userId)
    : supabase.from("payment_method_preferences").insert({ user_id: userId, ...row });
  const { data, error } = await request.select("saved_methods, default_method").single();
  if (error) throw error;
  return paymentMethodPreferencesFromRow(data);
}
