"use client";

import { Button } from "@heroui/react";
import Link from "next/link"

export default function AddPropertyBtn(){
  return (
    <Button
      as={Link}
      href="/properties/create"
      variant="solid"
      color="primary"
      size="sm"
    >
      Add Property
    </Button>
  )
}
