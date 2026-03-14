"use client";

import React from "react";
import { Button } from "@heroui/react";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

import ApartmentCard from "@/app/components/ui/ApartmentCard";

import { ChevronLeft, ChevronRight } from "lucide-react"

interface ApartmentItem {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
}

interface RenderApartmentsCarouselProps {
  apartment: ApartmentItem[];
}

export default function ApartmentCarousel({apartment}: RenderApartmentsCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();

  return (
    <Carousel setApi={setApi} className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-poppins font-semibold md:text-3xl">
          Apartments Tenants Love
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
          apartment.map(apt => (
            <CarouselItem key={apt.id} className="basis-auto">
              <ApartmentCard
                name={apt.name}
                location={apt.location}
                price={apt.price}
                rating={apt.rating}
                thumbnailUrl={apt.image}
              />
            </CarouselItem>
          ))
        }
      </CarouselContent>

    </Carousel>
  );
}
