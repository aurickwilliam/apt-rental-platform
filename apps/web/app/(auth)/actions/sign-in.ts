"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@repo/supabase/server";
import { PORTAL_COOKIE } from "@/lib/portal-preference";

export interface SignInFormState {
  error: string | null;
}

interface UserRolesProfile { roles: string[] }

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

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    await supabase.auth.signOut();
    return { error: "Could not verify your account. Please try again." };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("roles")
    .eq("user_id", user.id)
    .single();
  const profile = profileData as unknown as UserRolesProfile | null;

  if (profile?.roles.includes("admin")) {
    redirect("/admin/dashboard");
  }

  if (profileError || !profile) {
    console.error("Could not load sign-in profile", profileError);
    await supabase.auth.signOut();
    return { error: "Could not load your profile. Please try again." };
  }

  if ((role !== "tenant" && role !== "landlord") || !profile.roles.includes(role)) {
    await supabase.auth.signOut();
    return {
      error:
        role === "landlord"
          ? "This account is not registered as a landlord."
          : "This account is not registered as a tenant.",
    };
  }

  (await cookies()).set(PORTAL_COOKIE, role, { sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });

  // Redirect based on role
  if (role === "landlord") {
    redirect("/landlord/dashboard");
  } else {
    redirect("/tenant/my-rental");
  }
}
