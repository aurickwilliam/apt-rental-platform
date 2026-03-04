"use client"

import { Button } from "@heroui/react"

import {
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export default function ApartmentNavigation() {
  return (
    <div className="flex gap-3">
      <Button
        variant="flat"
        radius="full"
        isIconOnly
        onPress={() => {
          console.log("Previous button clicked");
        }}
      >
        <ChevronLeft className="text-grey-700" />
      </Button>
      <Button
        variant="flat"
        radius="full"
        isIconOnly
        onPress={() => {
          console.log("Next button clicked");
        }}
      >
        <ChevronRight className="text-grey-700" />
      </Button>
    </div>
  )
}