"use client";

import { Button } from "@heroui/react";
import { IconShare } from "@tabler/icons-react";

export default function ShareBtn() {
  return (
    <Button
      variant="tertiary"
      size="md"
      isIconOnly
    >
      <IconShare size={20} />
    </Button>
  );
}
