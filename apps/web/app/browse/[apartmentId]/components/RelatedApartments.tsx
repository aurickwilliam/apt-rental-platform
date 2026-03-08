"use client";

import { useState } from "react";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import { Button } from "@heroui/react";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RelatedApartments() {
  const [api, setApi] = useState<CarouselApi>();

  return (
    <Carousel setApi={setApi} className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-dm-serif font-medium text-secondary md:text-3xl">
          Related Apartments
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            isIconOnly
            radius="full"
            onPress={() => api?.scrollPrev()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="flat"
            isIconOnly
            radius="full"
            onPress={() => api?.scrollNext()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

      </div>

      <CarouselContent className="mt-4 pb-4">
        {
          Array.from({length: 10}).map((_, index) => (
            <CarouselItem key={index} className="basis-auto">
              <ApartmentCard
                id={index.toLocaleString()}
                name={"Apartment Name"}
                location={"Barangay, City"}
                price={10000}
                rating={4.5}
                thumbnailUrl={"/default/default-thumbnail.jpeg"}
              />
            </CarouselItem>
          ))
        }
      </CarouselContent>

    </Carousel>
  );
}
