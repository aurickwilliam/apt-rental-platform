"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import { Button } from "@heroui/react";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  apartments: {
    id: string;
    name: string;
    city: string;
    monthly_rent: number;
    average_rating: number;
    image: string;
  }[];
};

export default function RelatedApartments({apartments} : Props) {
  const [api, setApi] = useState<CarouselApi>();

  const router = useRouter();

  return (
    <Carousel setApi={setApi} className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-noto-serif font-medium text-secondary md:text-3xl">
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
        {apartments.map((apt) => (
          <CarouselItem key={apt.id} className="basis-auto">
            <ApartmentCard
              name={apt.name}
              location={apt.city}
              price={apt.monthly_rent}
              rating={apt.average_rating ?? 0}
              thumbnailUrl={apt.image}
              onPress={() => router.push(`/browse/${apt.id}`)}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

    </Carousel>
  );
}
