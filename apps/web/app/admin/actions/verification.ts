"use server";

import { createClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../_lib/require-admin";

type ReviewStatus = "approved" | "rejected";

export interface ReviewResult {
  error?: string;
}

function getReviewInput(formData: FormData): { id: string; status: ReviewStatus; reason: string | null } | ReviewResult {
  const id = formData.get("id");
  const status = formData.get("status");
  const reasonValue = formData.get("reason");
  const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";

  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return { error: "Invalid verification request." };
  if (status !== "approved" && status !== "rejected") return { error: "Invalid review decision." };
  if (status === "rejected" && !reason) return { error: "A rejection reason is required." };
  return { id, status, reason: reason || null };
}

async function review(table: "user_verifications" | "apartment_verifications", formData: FormData): Promise<ReviewResult> {
  await requireAdmin();
  const input = getReviewInput(formData);
  if (!("id" in input)) return input;

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ status: input.status, rejection_reason: input.reason })
    .eq("id", input.id);

  if (error) {
    console.error(`Admin ${table} review failed`, error);
    return { error: "The review could not be saved. Refresh and try again." };
  }

  revalidatePath("/admin");
  return {};
}

export async function reviewUserVerification(formData: FormData): Promise<ReviewResult> {
  return review("user_verifications", formData);
}

export async function reviewApartmentVerification(formData: FormData): Promise<ReviewResult> {
  return review("apartment_verifications", formData);
}
