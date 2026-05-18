"use client";

import { Button } from "@heroui/react";

import Link from "next/link"

import { CirclePlus } from "lucide-react";

export default function AddPropertyBtn(){
  return (
    <Button size="sm">
      <CirclePlus size={16} />

      <Link href="/landlord/properties/create">
        Add Property
      </Link>
    </Button>
  )
}
