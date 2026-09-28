"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { cookies } from "next/headers";
import { PORTAL_COOKIE } from "@/lib/portal-preference";

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  (await cookies()).delete(PORTAL_COOKIE);

  redirect("/sign-in");
}
