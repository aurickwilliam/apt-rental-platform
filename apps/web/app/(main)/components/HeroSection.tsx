"use client";

import { Image } from "@heroui/react";
import NextImage from "next/image";
import StartBrowsingBtn from "./StartBrowsingBtn";
import BrowsingField from "./BrowsingField";

export default function HeroSection() {
  return (
    <section className="w-full h-[600px] bg-grey-300 rounded-xl relative mb-50 md:mb-20">
      <Image
        as={NextImage}
        src="/building-bg.png"
        alt="Hero Image"
        width={1300}
        height={600}
        classNames={{ wrapper: "!absolute inset-0" }}
        className="object-cover w-full h-full rounded-xl"
      />

      {/* Overlay Description */}
      <div className="absolute inset-0 top-[5%] p-4 z-10 md:w-1/2 md:left-10 md:top-20">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white text-left">
          Find, Rent, and Manage. All in one place.
        </h1>

        <p className="text-lg font-medium text-darker-white mt-3 ">
          From high-res tours to automated rent payments, we’ve simplified the entire rental journey.
        </p>

        <StartBrowsingBtn />
      </div>

      <div className="absolute -bottom-50 left-0 right-0 p-4 z-10 md:-bottom-10 md:left-10 md:right-10">
        <BrowsingField />
      </div>
    </section>
  );
}
