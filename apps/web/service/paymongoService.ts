"use client";

import { createClient } from "@repo/supabase/browser";
import type { BankCode } from "@repo/constants";

// Web twin of mobile service/payments/paymongoService.ts.
// Proxies PayMongo through the `paymongo` edge function so the secret never
// reaches the browser. Every method (wallets, bank transfer and card) is paid on
// PayMongo's hosted page, so no account, wallet or card number goes through the app.
// Mock mode applies server-side while PAYMONGO_SECRET_KEY is unset (-fail/-expired
// simulation).

export type PaymongoCheckoutSession = {
  id: string;
  checkoutUrl: string;
  status: string;
};

export type PaymongoSessionStatus = "paid" | "failed" | "expired" | "pending";

export class PaymongoError extends Error {
  reason: string;
  code: string | null;

  constructor(reason: string, code: string | null = null) {
    super(reason);
    this.name = "PaymongoError";
    this.reason = reason;
    this.code = code;
  }
}

type PaymongoEnvelope<T> = {
  data: T;
};

export const NETWORK_ERROR_CODE = "network_error";
const NETWORK_ERROR_REASON =
  "We could not reach the server. Check your connection and try again. If you already paid, your payment is safe.";
// Delays before retrying a dropped connection (up to 3 attempts in all).
const NETWORK_RETRY_DELAYS_MS = [1000, 2000];

async function extractError(error: unknown): Promise<{ reason: string; code: string | null }> {
  const response = (error as { context?: Response }).context;
  if (response) {
    try {
      const body = (await response.json()) as { errors?: { detail?: string; code?: string }[] };
      const first = body.errors?.[0];
      if (first?.detail) return { reason: first.detail, code: first.code ?? null };
      if (first?.code) return { reason: first.code, code: first.code };
    } catch {
      // Response body was not JSON — fall through to the generic message.
    }
  }
  // The request never reached the function (e.g. the connection dropped).
  // Nothing is known about the payment.
  if ((error as { name?: string }).name === "FunctionsFetchError") {
    return { reason: NETWORK_ERROR_REASON, code: NETWORK_ERROR_CODE };
  }
  return {
    reason: (error as { message?: string }).message ?? "Payment failed. Please try again.",
    code: null,
  };
}

async function invoke<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<T>("paymongo", {
    body: { action, ...payload },
  });

  if (error) {
    const { reason, code } = await extractError(error);
    throw new PaymongoError(reason, code);
  }

  return data as T;
}

// Only for calls that are safe to repeat (status checks, cancelling): a brief
// network drop should not look like a failed payment.
async function invokeRepeatable<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await invoke<T>(action, payload);
    } catch (error) {
      const delay = NETWORK_RETRY_DELAYS_MS[attempt];
      if (!(error instanceof PaymongoError) || error.code !== NETWORK_ERROR_CODE || delay === undefined) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function createCheckoutSession(params: {
  renewalProposalId?: string;
  referenceId: string;
  amount: number;
  description: string;
  redirectBaseUrl: string;
  method?: "gcash" | "maya" | "qrph" | "bank_transfer" | "card";
  bankCode?: BankCode;
  tenancyId?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  dueDate?: string | null;
}): Promise<PaymongoCheckoutSession> {
  const response = await invoke<PaymongoEnvelope<{ id: string; attributes: { status: string; checkout_url: string } }>>(
    "createCheckoutSession",
    params,
  );

  return {
    id: response.data.id,
    checkoutUrl: response.data.attributes.checkout_url,
    status: response.data.attributes.status,
  };
}

// The backend is the source of truth for payment status. URL params never
// determine the outcome — only this endpoint's verdict is trusted.
export async function getCheckoutSessionStatus(sessionId: string): Promise<PaymongoSessionStatus> {
  return (await getCheckoutSessionDetails(sessionId)).status;
}

function toSessionStatus(status: string): PaymongoSessionStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
    case "cancelled":
      return "failed";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

export async function getCheckoutSessionDetails(sessionId: string): Promise<{ status: PaymongoSessionStatus; checkoutUrl: string | null }> {
  const response = await invokeRepeatable<PaymongoEnvelope<{ id: string; attributes: { status: string; checkout_url?: string } }>>(
    "getCheckoutSessionStatus",
    { sessionId },
  );

  const attributes = response.data.attributes;
  return { status: toSessionStatus(attributes.status), checkoutUrl: attributes.checkout_url ?? null };
}

// The tenant backed out of the hosted checkout: ask the backend to close the
// session so it can't be paid later. Its verdict is what counts ("paid" if the
// payment went through first, "pending" if the session could not be closed).
export async function cancelCheckoutSession(sessionId: string): Promise<PaymongoSessionStatus> {
  const response = await invokeRepeatable<PaymongoEnvelope<{ id: string; attributes: { status: string } }>>(
    "cancelCheckoutSession",
    { sessionId },
  );
  return toSessionStatus(response.data.attributes.status);
}
