import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AppSection from "../(main)/components/AppSection";
import HeroSection from "../(main)/components/HeroSection";
import ProductShowcaseSection from "../(main)/components/ProductShowcaseSection";
import RentalStepsSection from "../(main)/components/RentalStepsSection";
import OwnerCtaSection from "../(main)/components/OwnerCtaSection";
import FeaturedApartments from "../(main)/components/FeaturedApartments";
import FeaturedApartmentsState from "../(main)/components/FeaturedApartmentsState";
import TeamSection from "../(main)/components/TeamSection";
import FaqSection from "../(main)/components/FaqSection";
import ContactSection from "../(main)/components/ContactSection";
import styles from "../(main)/components/landing-motion.module.css";
import JourneyScene from "../(main)/components/journey/JourneyScene";
import JourneyCta from "../(main)/components/journey/JourneyCta";

import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";

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

  return (
    <div className="min-h-screen" data-landing-page>
      <main className="mx-auto max-w-7xl px-6">
        <HeroSection />
        <JourneyScene>
          <section data-journey-featured className={`pb-8 sm:pb-12 ${styles.featured}`}>
            <Suspense fallback={<FeaturedApartmentsState state="loading" />}>
              <FeaturedApartments supabase={supabase} />
            </Suspense>
          </section>

          <ProductShowcaseSection />
          <RentalStepsSection />
          <JourneyCta />
        </JourneyScene>
        <OwnerCtaSection />
        <AppSection />
        <TeamSection />
        <FaqSection />
        <ContactSection />
      </main>
    </div>
  );
}
