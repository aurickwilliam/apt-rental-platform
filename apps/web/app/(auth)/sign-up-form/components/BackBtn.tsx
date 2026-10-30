"use client";

import { Link } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "../../components/AuthContext";

export default function BackBtn() {
  const { role } = useAuth();

  return (
    <Link
      href={`/sign-up?role=${role}`}
      className="inline-flex cursor-pointer items-center gap-2 font-medium text-primary no-underline"
    >
      <IconArrowLeft size={18} aria-hidden="true" />
      Back
    </Link>
  );
}
