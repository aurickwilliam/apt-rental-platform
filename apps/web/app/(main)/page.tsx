import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import ApartmentCarousel from "./components/ApartmentCarousel";
import AppSection from "./components/AppSection";
import HeroSection from "./components/HeroSection";
import HowItWorksSection from "./components/HowItWorksSection";
import WhyUsSection from "./components/WhyUsSection";

import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";
import { rankTenantLovedApartments } from "@/lib/tenant-loved-apartments";

import { createClient } from "@repo/supabase/server";

export const metadata: Metadata = {
  title: "APT — Find, Rent, and Manage Apartments in Camanava",
  description:
    "Discover verified apartments in Caloocan, Malabon, Navotas and Valenzuela. Chat with landlords, apply online, sign leases and pay rent in one place.",
};

export default async function Home() {
  const supabase = await createClient();

  // Redirect immediately the user to their respective dashboard
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Fetch the user's role from your profile/users table
    const { data: profile } = await supabase
      .from('users')
      .select('roles')
      .eq('user_id', user.id)
      .single();

    // Redirect based on role
    const roles = (profile as unknown as { roles: string[] } | null)?.roles ?? [];
    if (roles.includes('admin')) redirect('/admin/dashboard');
    const portal = preferredPortal(roles, (await cookies()).get(PORTAL_COOKIE)?.value ?? null);
    if (portal === 'landlord') redirect('/landlord/dashboard');
    if (portal === 'tenant') redirect('/tenant/my-rental');
  }

  const { data: apartments, error } = await supabase
    .from('apartments')
    .select(`
      id,
      name,
      city,
      monthly_rent,
      average_rating,
      no_ratings,
      created_at,
      apartment_images(url, is_cover)
    `)
    .eq('is_hidden_by_admin', false)
    .is('deleted_at', null)
    .eq("status", "available")
    .eq("is_verified", true)
    .limit(100)
    .order('created_at', { ascending: false });

  if (error) console.error(error);

  const mapped = rankTenantLovedApartments(apartments ?? []).map((apt) => ({
    id: apt.id,
    name: apt.name,
    location: apt.city,
    price: apt.monthly_rent,
    rating: apt.average_rating ?? 0,
    image: apt.apartment_images?.find((img) => img.is_cover)?.url ?? '/default/default-thumbnail.jpeg',
  }));

  // Android APK download availability. To publish the app:
  //   1. Apply the app-downloads bucket migration
  //      (supabase/migrations/20261020100000_create_app_downloads_bucket.sql)
  //      and upload the APK to that bucket (dashboard upload; the bucket is
  //      public read, writes stay operator-only).
  //   2. Set NEXT_PUBLIC_APT_APK_URL to the file's public URL in
  //      apps/web/.env.local (and the host's env settings), e.g.
  //      https://<project-ref>.supabase.co/storage/v1/object/public/app-downloads/APT-latest.apk
  //      then restart/redeploy.
  //   3. Until then the buttons render disabled with a "Coming soon" chip and
  //      /download answers 404; no code change is needed to enable them.
  const apkAvailable = Boolean(process.env.NEXT_PUBLIC_APT_APK_URL?.trim());

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-7xl flex-col px-4 pt-4">
        {/* Intro */}
        <HeroSection apkAvailable={apkAvailable} />

        {/* Why Us */}
        <WhyUsSection />

        {/* Featured Apartments */}
        <section className="md:mt-16">
          <ApartmentCarousel apartment={mapped} />
        </section>

        {/* How it Works */}
        <HowItWorksSection />

        {/* Get the App */}
        <AppSection apkAvailable={apkAvailable} />
      </main>
    </div>
  );
}
