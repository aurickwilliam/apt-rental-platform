"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

export default function BackBtn() {
  return (
    <Button
      as={Link}
      variant="bordered"
      radius="full"
      startContent={<ArrowLeft size={18} />}
      href="/browse"
    >
      Back
    </Button>
  );
}
