"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";

export interface SignInFormState {
  error: string | null;
}

export async function signIn(
  _prevState: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map common Supabase auth errors to user-friendly messages
    if (error.message === "Invalid login credentials") {
      return { error: "Invalid email or password. Please try again." };
    }
    if (error.message === "Email not confirmed") {
      return { error: "Please verify your email address before signing in." };
    }
    if (error.message.includes("rate limit")) {
      return { error: "Too many sign-in attempts. Please try again later." };
    }
    return { error: error.message };
  }

  // Redirect based on role
  if (role === "landlord") {
    redirect("/dashboard");
  } else {
    redirect("/my-rental");
  }
}
