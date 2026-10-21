"use client";

import Link from "next/link";

import { Button } from "@heroui/react";

export default function DiscoverNowBtn() {
  return (
    <Link href="/browse" className="inline-flex">
      <Button variant="outline">Discover Now</Button>
    </Link>
  );
}
