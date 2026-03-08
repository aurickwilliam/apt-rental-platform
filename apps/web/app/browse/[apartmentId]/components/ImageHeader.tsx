"use client";

import { Image, Button } from "@heroui/react";
import NextImage from "next/image";

interface ImageHeaderProps {
  imageUrl: string[];
}

export default function ImageHeader({ imageUrl }: ImageHeaderProps) {
  console.log("Image URLs:", imageUrl);

  return (
    <div className="w-full h-128 relative flex gap-5">
      <div className="w-2/3 relative h-full">
        <Image
          as={NextImage}
          src={imageUrl[0]}
          alt="Apartment Image"
          fill
          removeWrapper
          className="object-cover"
        />
      </div>

      <div className="w-1/3 flex flex-col gap-5">
        <div className="relative h-1/2">
          <Image
            as={NextImage}
            src={imageUrl[1]}
            alt="Apartment Image"
            fill
            removeWrapper
            className="object-cover"
          />
        </div>

        <div className="relative h-1/2">
          <Image
            as={NextImage}
            src={imageUrl[2]}
            alt="Apartment Image"
            fill
            removeWrapper
            className="object-cover"
          />

          <Button
            variant="faded"
            radius="full"
            className="absolute bottom-2 right-2 z-10"
            size="sm"
          >
            See more photos
          </Button>
          
        </div>
      </div>
    </div>
  );
}
