"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../components/AuthContext";

export default function BackBtn() {
  const { role } = useAuth();

  return (
    <Link href={`/sign-up?role=${role}`}>
      <Button variant="ghost" className="font-medium rounded-full">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </Link>
  );
}
