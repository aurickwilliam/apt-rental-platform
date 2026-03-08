"use client";

import { Button } from "@heroui/react";
import { Heart } from "lucide-react";

export default function FavoriteBtn() {
  return (
    <Button
      variant="light"
      size="md"
      radius="full"
      isIconOnly
    >
      <Heart size={20} />
    </Button>
  );
}
