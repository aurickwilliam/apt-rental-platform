import ApartmentCarousel from "./components/ApartmentCarousel";
import DiscoverNowBtn from "./components/DiscoverNowBtn";

import { Divider } from "@heroui/react";

import {
  KeyRound,
  Building2,
  ClipboardCheck,
  Map,
  SearchCheck,
  FileCheckCorner,
  BanknoteArrowUp,
} from "lucide-react";
import HeroSection from "./components/HeroSection";

export default function Home() {
  return (
    <>
      <div className="bg-white min-h-screen">
        <main className="max-w-7xl mx-auto px-4 pt-4 flex flex-col">
          {/* Intro */}
          <HeroSection />

          {/* Why Us */}
          <section className="mt-10">
            <h2 className="text-3xl text-primary text-center font-poppins font-semibold mb-4 md:text-5xl">
              Why Us?
            </h2>

            <p className="text-center font-medium">
              A comprehensive ecosystem designed to simplify the rental
              experience for everyone involved.
            </p>

            <div className="flex flex-col gap-5 md:flex-row mt-10 md:mt-20">
              <div className="flex flex-col gap-3">
                <KeyRound className="text-primary" size={48} />

                <h3 className="text-2xl font-poppins font-medium">
                  For Tenants
                </h3>

                <p>
                  Find a place that truly feels like home. We make renting
                  simple with verified listings, transparent pricing, and
                  responsive support, so you can move in with confidence and
                  peace of mind.
                </p>
              </div>

              <Divider className="my-3 md:hidden" />
              <Divider
                className="mx-2 hidden md:block self-stretch h-auto"
                orientation="vertical"
              />

              <div className="flex flex-col gap-3">
                <Building2 className="text-primary" size={48} />

                <h3 className="text-2xl font-poppins font-medium">
                  For Owners
                </h3>

                <p>
                  Maximize your property’s value without the hassle. From tenant
                  screening to rent collection, we help you manage your rentals
                  efficiently while keeping your investment secure.
                </p>
              </div>

              <Divider className="my-3 md:hidden" />
              <Divider
                className="mx-2 hidden md:block self-stretch h-auto"
                orientation="vertical"
              />

              <div className="flex flex-col gap-3">
                <ClipboardCheck className="text-primary" size={48} />

                <h3 className="text-2xl font-poppins font-medium">
                  For Management
                </h3>

                <p>
                  Streamline operations and stay in control. Our platform
                  centralizes property management, improves communication, and
                  reduces manual work, so you can focus on growing your
                  portfolio.
                </p>
              </div>
            </div>
          </section>

          {/* Featured Apartments */}
          <section className="md:mt-20">
            <ApartmentCarousel />
          </section>

          <Divider className="my-10" />

          {/* How it Works */}
          <section className="md:mt-10 mb-10">
            <h2 className="text-3xl text-primary text-center font-poppins font-semibold mb-4 md:text-5xl">
              How it Works?
            </h2>

            <p className="text-center font-medium">
              A stress-free way to navigate the rental market with verified
              listings and secure digital tools.
            </p>

            <div className="flex flex-col md:flex-row gap-5 mt-5 md:mt-10">
              {/* Discover */}
              <div className="bg-darker-white flex flex-col gap-3 w-full p-8 rounded-2xl md:w-1/2">
                <Map size={48} className="text-primary" />

                <h2 className="text-3xl text-primary font-poppins font-semibold">
                  Discover
                </h2>

                <p className="text-base">
                  Explore a wide range of verified listings and use intelligent
                  filters to narrow down your options based on location, budget,
                  amenities, and lifestyle preferences. Finding the right home
                  becomes faster, easier, and stress-free.
                </p>

                <div className="flex flex-col gap-3 mt-5">
                  <div className="flex gap-2 items-center">
                    <SearchCheck size={24} className="text-primary" />
                    <p className="text-base font-medium">Verified Listings</p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <SearchCheck size={24} className="text-primary" />
                    <p className="text-base font-medium">Intelligent Filters</p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <SearchCheck size={24} className="text-primary" />
                    <p className="text-base font-medium">
                      Lifestyle Preferences
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <SearchCheck size={24} className="text-primary" />
                    <p className="text-base font-medium">AI Assist Search</p>
                  </div>
                </div>

                <div className="mt-5">
                  <DiscoverNowBtn />
                </div>
              </div>

              {/* Apply & Pay */}
              <div className="flex flex-col gap-5 md:w-1/2">
                <div className="bg-darker-white flex flex-col gap-3 w-full p-8 rounded-2xl">
                  <FileCheckCorner size={48} className="text-primary" />

                  <h2 className="text-3xl text-primary font-poppins font-semibold">
                    Apply & Sign
                  </h2>

                  <p className="text-base">
                    Complete your rental application entirely online and upload
                    required documents with ease. Review agreements clearly and
                    sign securely using digital e-signing, eliminating paperwork
                    and unnecessary delays.
                  </p>
                </div>

                <div className="bg-darker-white flex flex-col gap-3 w-full p-8 rounded-2xl">
                  <BanknoteArrowUp size={48} className="text-primary" />

                  <h2 className="text-3xl text-primary font-poppins font-semibold">
                    Live & Pay
                  </h2>

                  <p className="text-base">
                    Settle into your new home with full control at your
                    fingertips. Manage rent payments, track records, receive
                    updates, and communicate with owners or management, all
                    conveniently from your mobile device.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
