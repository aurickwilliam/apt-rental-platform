"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { ArrowLeft } from "lucide-react";

export default function BackBtn() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onPress={() => router.back()}
    >
      <ArrowLeft size={18} />
      Back
    </Button>
  );
}
