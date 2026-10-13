"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { IconArrowLeft } from "@tabler/icons-react";

export default function BackBtn() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onPress={() => router.back()}
    >
      <IconArrowLeft size={18} />
      Back
    </Button>
  );
}
