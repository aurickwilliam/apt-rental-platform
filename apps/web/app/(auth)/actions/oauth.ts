"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";

type OAuthProvider = "google" | "facebook" | "apple" | "github" | "gitlab" | "bitbucket" | "discord" | "twitter" | "azure" | "keycloak" | "linkedin" | "linkedin_oidc" | "notion" | "slack" | "slack_oidc" | "spotify" | "twitch" | "workos" | "zoom" | "fly";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Something went wrong. Please try again." };
}

export async function signInWithGoogle() {
  return signInWithOAuth("google");
}

export async function signInWithFacebook() {
  return signInWithOAuth("facebook");
}

export async function signInWithApple() {
  return signInWithOAuth("apple");
}
