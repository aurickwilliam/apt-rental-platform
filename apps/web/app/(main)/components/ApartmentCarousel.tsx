"use client";

import React from "react";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { Button } from "@heroui/react";

import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ApartmentCarousel() {
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
          [1, 2, 3, 4, 5, 6].map((num) => (
            <CarouselItem key={num} className="basis-auto">
              <ApartmentCard />
            </CarouselItem>
          ))
        }
      </CarouselContent>

    </Carousel>
  );
}