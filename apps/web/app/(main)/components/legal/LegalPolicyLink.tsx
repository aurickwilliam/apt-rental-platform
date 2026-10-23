"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { Link } from "@heroui/react";

interface LegalPolicyLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function LegalPolicyLink({
  href,
  className,
  children,
}: LegalPolicyLinkProps) {
  const router = useRouter();
  const prefetch = () => router.prefetch(href);

  return (
    <Link
      href={href}
      onHoverStart={prefetch}
      onFocus={prefetch}
      render={(props) =>
        "href" in props ? (
          <NextLink {...props} prefetch />
        ) : (
          <span {...props} />
        )
      }
      className={className}
    >
      {children}
    </Link>
  );
}
