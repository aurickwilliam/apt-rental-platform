"use client";

import { createClient } from "@repo/supabase/browser";

// Web twin of mobile service/payments/paymongoService.ts (read-only study, not modified).
// Proxies PayMongo through the `paymongo` edge function so the secret never
// reaches the browser. Mock mode applies server-side while PAYMONGO_SECRET_KEY
// is unset (-fail/-expired simulation, card 0002 decline).

export type PaymongoCard = {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  name: string;
};

export type PaymongoCheckoutSession = {
  id: string;
  checkoutUrl: string;
  status: string;
};

export type PaymongoSessionStatus = "paid" | "failed" | "expired" | "pending";

export type PaymongoCardPaymentResult = {
  status: "succeeded" | "failed";
  failureReason: string | null;
};

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

export async function createCheckoutSession(params: {
  referenceId: string;
  amount: number;
  description: string;
  redirectBaseUrl: string;
  method?: "gcash" | "maya" | "qrph";
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
  const response = await invoke<PaymongoEnvelope<{ id: string; attributes: { status: string; checkout_url?: string } }>>(
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
  const response = await invoke<PaymongoEnvelope<{ id: string; attributes: { status: string } }>>(
    "cancelCheckoutSession",
    { sessionId },
  );
  return toSessionStatus(response.data.attributes.status);
}

export async function createCardPayment(params: {
  referenceId: string;
  amount: number;
  description: string;
  card: PaymongoCard;
  tenancyId?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  dueDate?: string | null;
}): Promise<PaymongoCardPaymentResult> {
  const response = await invoke<PaymongoEnvelope<{ attributes: { status: string; failure_reason: string | null } }>>(
    "createCardPayment",
    params,
  );

  return {
    status: response.data.attributes.status === "succeeded" ? "succeeded" : "failed",
    failureReason: response.data.attributes.failure_reason,
  };
}
