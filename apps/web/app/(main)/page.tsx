import Image from "next/image";

import AppNavbar from "../components/layout/AppNavbar";
import StartBrowsingBtn from "./components/StartBrowsingBtn";
import BrowsingField from "./components/BrowsingField";
import ApartmentCarousel from "./components/ApartmentCarousel";

import { Divider } from "@heroui/react";

import {
  KeyRound,
  Building2,
  ClipboardCheck,
  Map,
  SearchCheck,
  FileCheckCorner,
  BanknoteArrowUp
} from "lucide-react"
import DiscoverNowBtn from "./components/DiscoverNowBtn";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <>
      <AppNavbar />

      <main className="max-w-7xl mx-auto p-4 flex flex-col">
        {/* Intro */}
        <section className="w-full h-[600px] bg-grey-300 rounded-xl relative mb-50">
          <Image 
            src="/building-bg.png"
            alt="Hero Image"
            width={1200}
            height={700}
            className="object-cover w-full h-full rounded-xl"
          />

          {/* Overlay Description */}
          <div className="absolute inset-0 top-[5%] p-4">
            <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white text-left">
              Find, Rent, and Manage. All in one place.
            </h1>

            <p className="text-lg font-medium text-darker-white mt-3">
              From high-res tours to automated rent payments, we’ve simplified the entire rental journey.
            </p>

            <StartBrowsingBtn />
          </div>

          <div className="absolute -bottom-50 left-0 right-0 p-4">
            <BrowsingField />
          </div>
        </section>

        {/* Why Us */}
        <section className="mt-10">
          <h2 className="text-3xl text-primary text-center font-poppins font-semibold mb-4">
            Why Us?
          </h2>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <KeyRound 
                className="text-primary" 
                size={48} 
              />

              <h3 className="text-2xl font-poppins font-medium">
                For Tenants
              </h3>

              <p>
                Find a place that truly feels like home. We make renting simple with verified listings, transparent pricing, and responsive support, so you can move in with confidence and peace of mind.
              </p>
            </div>

            <Divider className="my-3" />

            <div className="flex flex-col gap-3">
              <Building2 
                className="text-primary" 
                size={48} 
              />

              <h3 className="text-2xl font-poppins font-medium">
                For Owners
              </h3>

              <p>
                Maximize your property’s value without the hassle. From tenant screening to rent collection, we help you manage your rentals efficiently while keeping your investment secure.
              </p>
            </div>
    
            <Divider className="my-3" />

            <div className="flex flex-col gap-3">
              <ClipboardCheck 
                className="text-primary" 
                size={48} 
              />

              <h3 className="text-2xl font-poppins font-medium">
                For Management
              </h3>

              <p>
                Streamline operations and stay in control. Our platform centralizes property management, improves communication, and reduces manual work, so you can focus on growing your portfolio.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Apartments */}
        <section>
          <ApartmentCarousel />
        </section>

        <Divider className="my-10" />

        {/* How it Works */}
        <section>
          <h2 className="text-3xl text-primary text-center font-poppins font-semibold mb-4">
            How it Works?
          </h2>

          <div className="flex flex-col md:flex-row gap-5 mt-5">
            {/* Discover */}
            <div className="bg-white flex flex-col gap-3 w-full p-8 rounded-2xl">
              <Map
                size={48}
                className="text-primary"
              />

              <h2 className="text-3xl text-primary font-poppins font-semibold">
                Discover
              </h2>

              <p className="text-base">
                Explore a wide range of verified listings and use intelligent filters to narrow down your options based on location, budget, amenities, and lifestyle preferences. Finding the right home becomes faster, easier, and stress-free.
              </p>

              <div className="flex flex-col gap-3 mt-5">
                <div className="flex gap-2 items-center">
                  <SearchCheck
                    size={24}
                    className="text-primary"
                  />
                  <p className="text-base font-medium">
                    Verified Listings
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <SearchCheck
                    size={24}
                    className="text-primary"
                  />
                  <p className="text-base font-medium">
                    Intelligent Filters
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <SearchCheck
                    size={24}
                    className="text-primary"
                  />
                  <p className="text-base font-medium">
                    Lifestyle Preferences
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <SearchCheck
                    size={24}
                    className="text-primary"
                  />
                  <p className="text-base font-medium">
                    AI Assist Search
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <DiscoverNowBtn />
              </div>
            </div>

            {/* Apply & Pay */}
            <div className="flex flex-col gap-5">
              <div className="bg-white flex flex-col gap-3 w-full p-8 rounded-2xl">
                <FileCheckCorner
                  size={48}
                  className="text-primary"
                />

                <h2 className="text-3xl text-primary font-poppins font-semibold">
                  Apply & Sign
                </h2>

                <p className="text-base">
                  Complete your rental application entirely online and upload required documents with ease. Review agreements clearly and sign securely using digital e-signing, eliminating paperwork and unnecessary delays.
                </p>
              </div>

              <div className="bg-white flex flex-col gap-3 w-full p-8 rounded-2xl">
                <BanknoteArrowUp
                  size={48}
                  className="text-primary"
                />

                <h2 className="text-3xl text-primary font-poppins font-semibold">
                  Live & Pay
                </h2>

                <p className="text-base">
                  Settle into your new home with full control at your fingertips. Manage rent payments, track records, receive updates, and communicate with owners or management, all conveniently from your mobile device.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
