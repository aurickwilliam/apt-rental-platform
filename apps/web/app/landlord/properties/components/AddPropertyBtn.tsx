"use client";

import { Button } from "@heroui/react";
import Link from "next/link"
import { CirclePlus } from "lucide-react";

export default function AddPropertyBtn(){
  return (
    <Button
      as={Link}
      href="/landlord/properties/create"
      variant="solid"
      color="primary"
      size="sm"
      startContent={<CirclePlus size={16} />}
    >
      Add Property
    </Button>
  )
}
