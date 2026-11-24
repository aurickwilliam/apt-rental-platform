"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";

import { Button } from "@heroui/react";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

type Props = {
  apartments: {
    id: string;
    name: string;
    city: string;
    monthly_rent: number;
    average_rating: number;
    image: string;
  }[];
  basePath?: string;
};

export default function RelatedApartments({apartments, basePath = "/browse"} : Props) {
  const [api, setApi] = useState<CarouselApi>();

  const router = useRouter();
  const { t } = useTranslation();

  // Below lg (the same breakpoint the page stacks at) the strip
  // free-scrolls like a native row; on PC it keeps snapping card to card.
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023.98px)");
    const handleChange = () => setIsMobileLayout(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <Carousel
      key={isMobileLayout ? "free" : "snap"}
      setApi={setApi}
      className="mt-10"
      opts={
        isMobileLayout
          ? { align: "start", containScroll: "trimSnaps", dragFree: true, skipSnaps: true }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-noto-serif font-medium text-brand md:text-3xl">
          {t("apartment.related.title")}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            isIconOnly
            onPress={() => api?.scrollPrev()}
            aria-label={t("apartment.related.previous")}
          >
            <IconChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            isIconOnly
            onPress={() => api?.scrollNext()}
            aria-label={t("apartment.related.next")}
          >
            <IconChevronRight className="w-4 h-4" />
          </Button>
        </div>

      </div>

      <CarouselContent className="mt-4 pb-4">
        {apartments.map((apt) => (
          <CarouselItem key={apt.id} className="basis-44 sm:basis-56 shrink-0 grow-0">
            <ApartmentCard
              name={apt.name}
              location={apt.city}
              price={apt.monthly_rent}
              rating={apt.average_rating ?? 0}
              thumbnailUrl={apt.image}
              onPress={() => router.push(`${basePath}/${apt.id}`)}
              sizes="(max-width: 640px) 176px, 224px"
            />
          </CarouselItem>
        ))}
      </CarouselContent>

    </Carousel>
  );
}
