"use client";

import Link from "next/link";

import { Button } from "@heroui/react";

import { IconSearch as SearchIcon } from "@tabler/icons-react";

// Link wraps the button (never the reverse) so Next can prefetch the browse
// route while the button keeps its HeroUI styling and focus behavior.
export default function StartBrowsingBtn() {
  return (
    <Link href="/browse" className="inline-flex">
      <Button variant="primary">
        <SearchIcon size={18} />
        Start Browsing
      </Button>
    </Link>
  );
}
