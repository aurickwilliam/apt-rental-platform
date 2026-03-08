"use client";

import { Card, CardBody, CardFooter, Button } from "@heroui/react";

import Image from "next/image";

import {
  Star,
  Heart,
} from "lucide-react"

export default function ApartmentCard() {
  return (
    <Card
      className="bg-white rounded-xl shadow-sm overflow-hidden w-56 relative"
      isPressable
      onPress={() => {
        console.log("Card Pressed")
      }}
    >
      <CardBody className="p-0">
        <Image
          src={'/default/default-thumbnail.jpeg'}
          alt="Apartment Thumbnail"
          width={300}
          height={200}
          className="rounded-xl object-cover size-56"
        />

        <div className="p-2">
          <h3 className="text-base font-semibold">
            Apartment Card
          </h3>

          <div className="flex items-center gap-1">
            <p className="text-gray-600 text-sm">
              Barangay, City
            </p>
          </div>
        </div>
      </CardBody>

      <CardFooter className="p-2 flex justify-between items-center">
        <p className="text-base font-medium text-primary">
          ₱ 15,000
        </p>

        <div className="flex items-center gap-1">
          <Star
            className="text-yellow-400"
            fill="currentColor"
            size={18}
          />
          <p className="text-sm">
            4.5
          </p>
        </div>
      </CardFooter>

      {/* Overlay */}
      <Button
        as="div"
        variant="flat"
        radius="full"
        className="absolute top-2 right-2 bg-black/30"
        isIconOnly
        onPress={() => {
          console.log("Favorite Press")
        }}
      >
        <Heart className="text-white" />
      </Button>
    </Card>
  );
}
