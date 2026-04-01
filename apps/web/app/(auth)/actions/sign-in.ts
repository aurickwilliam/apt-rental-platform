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

  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user!.id)
    .single();

  if (!userData || userData.role !== role) {
    await supabase.auth.signOut();
    return {
      error:
        role === "landlord"
          ? "This account is not registered as a landlord."
          : "This account is not registered as a tenant.",
    };
  }

  // Redirect based on role
  if (role === "landlord") {
    redirect("/landlord/dashboard");
  } else {
    redirect("/tenant/my-rental");
  }
}
