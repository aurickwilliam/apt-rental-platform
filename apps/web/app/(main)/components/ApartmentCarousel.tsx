"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

import ApartmentCard from "@/app/components/ui/ApartmentCard";

import { IconChevronLeft as ChevronLeft, IconChevronRight as ChevronRight } from "@tabler/icons-react";

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
  const [api, setApi] = useState<CarouselApi>();
  const router = useRouter();

  return (
    <Carousel setApi={setApi} className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-nunito text-2xl font-bold md:text-3xl">
            Apartments Tenants Love
          </h2>
          <p className="text-base text-muted-foreground">
            Verified homes our tenants rate highest.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            aria-label="Previous apartments"
            onPress={() => api?.scrollPrev()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            isIconOnly
            aria-label="Next apartments"
            onPress={() => api?.scrollNext()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

      </div>

      <CarouselContent className="mt-4 pb-4">
        {
          apartment.map(apt => (
            <CarouselItem key={apt.id} className="w-44 basis-auto sm:w-56">
              <ApartmentCard
                name={apt.name}
                location={apt.location}
                price={apt.price}
                rating={apt.rating}
                thumbnailUrl={apt.image}
                onPress={() => router.push(`/browse/${apt.id}`)}
              />
            </CarouselItem>
          ))
        }
      </CarouselContent>

    </Carousel>
  );
}
