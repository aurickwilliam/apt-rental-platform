import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import ApartmentCarousel from "./components/ApartmentCarousel";
import AppSection from "./components/AppSection";
import HeroSection from "./components/HeroSection";
import ProductShowcaseSection from "./components/ProductShowcaseSection";
import RentalStepsSection from "./components/RentalStepsSection";
import OwnerCtaSection from "./components/OwnerCtaSection";

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

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-6">
        <HeroSection />
        <section className="pb-8 sm:pb-12">
          <ApartmentCarousel apartment={mapped} />
        </section>

        <ProductShowcaseSection />
        <RentalStepsSection />
        <OwnerCtaSection />
        <AppSection />
      </main>
    </div>
  );
}
