import { buttonVariants } from "@heroui/react";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default function OwnerCtaSection() {
  return (
    <section aria-labelledby="owner-cta-title" className="my-12 flex flex-col gap-8 rounded-2xl bg-muted/40 p-6 sm:my-16 sm:p-8 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">For property owners</p>
        <h2 id="owner-cta-title" className="mt-4 font-nunito text-2xl font-bold tracking-tight text-foreground">Have a property to rent out?</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/75">
          List your property and manage rental applications and tenant communication with APT.
        </p>
      </div>
      <Link href="/forowners" className={buttonVariants({ variant: "primary", className: "landing-cta landing-responsive-cta shrink-0" })}>
        Explore owner tools <IconArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
