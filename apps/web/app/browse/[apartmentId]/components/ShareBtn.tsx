"use client";

import { Button } from "@heroui/react";
import { Share } from "lucide-react";

export default function ShareBtn() {
  return (
    <Button
      variant="light"
      size="md"
      radius="full"
      isIconOnly
    >
      <Share size={20} />
    </Button>
  );
}
