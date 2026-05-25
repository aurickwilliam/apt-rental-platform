"use client";

import { Button } from "@heroui/react";
import { Share } from "lucide-react";

export default function ShareBtn() {
  return (
    <Button
      variant="tertiary"
      size="md"
      isIconOnly
    >
      <Share size={20} />
    </Button>
  );
}
