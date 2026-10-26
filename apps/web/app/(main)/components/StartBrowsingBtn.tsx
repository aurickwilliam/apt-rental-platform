import Link from "next/link";

import { buttonVariants } from "@heroui/react";

import { IconArrowUpRight } from "@tabler/icons-react";

// HeroUI's exported styles keep navigation a single native Next anchor.
export default function StartBrowsingBtn() {
  return (
    <Link href="/browse" className={buttonVariants({ variant: "primary", className: "landing-cta landing-responsive-cta" })}>
      Explore apartments <IconArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
}
