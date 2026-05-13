"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { ArrowLeft } from "lucide-react";

export default function BackBtn() {
  const router = useRouter();

  return (
    <Button
      variant="bordered"
      radius="full"
      startContent={<ArrowLeft size={18} />}
      onPress={() => router.back()}
    >
      Back
    </Button>
  );
}
