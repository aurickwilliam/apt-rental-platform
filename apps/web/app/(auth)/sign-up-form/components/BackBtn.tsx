"use client";

import { Button, Link } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../components/AuthContext";

export default function BackBtn() {
  const { role } = useAuth();

  return (
    <Button
      variant="light"
      startContent={<ArrowLeft />}
      radius="full"
      className="font-medium"
      as={Link}
      href={`/sign-up?role=${role}`}
    >
      Back
    </Button>
  );
}
