"use client";
import { Button, Link } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

export default function BackBtn() {
  return (
    <Button
      variant="light"
      startContent={<ArrowLeft />}
      radius="full"
      className="font-medium"
      as={Link}
      href="/sign-in"
    >
      Back
    </Button>
  );
}
