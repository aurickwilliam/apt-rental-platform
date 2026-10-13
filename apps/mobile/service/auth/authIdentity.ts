// Structural subset of a Supabase Auth user: the sign-in methods it has.
export interface AuthIdentityUser {
  identities?: { provider: string }[] | null;
  app_metadata?: { providers?: unknown } | null;
}

// An `email` identity always means the account has a password (confirmed on
// the hosted project); Google-only accounts have only a `google` identity.
export function hasEmailPasswordIdentity(user: AuthIdentityUser): boolean {
  if (user.identities?.some((identity) => identity.provider === "email")) return true;
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("email");
}
