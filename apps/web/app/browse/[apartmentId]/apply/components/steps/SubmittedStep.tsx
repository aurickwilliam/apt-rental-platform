import NextImage from "next/image";
import Link from "next/link";
import { buttonVariants } from "@heroui/react";

/** Matches mobile's submitted screen: stays put until the tenant moves on. */
export default function SubmittedStep({ apartmentName }: { apartmentName: string | null }) {
  return (
    <div className="flex flex-col items-center py-8 text-center md:py-12">
      <NextImage src="/images/house-check.png" alt="" width={160} height={160} className="mb-5" priority />
      <h2 className="font-nunito text-3xl font-bold text-primary">Application Sent!</h2>
      <p className="mx-auto mt-3 max-w-xl text-base text-foreground">
        Your application for <span className="font-semibold">{apartmentName ?? "this apartment"}</span> has been
        submitted with your APT Passport documents. The rental owner will review it and get back to you soon.
      </p>
      <Link href="/tenant/my-rental" className={`mt-8 cursor-pointer ${buttonVariants({ variant: "primary" })}`}>
        View Application Status
      </Link>
    </div>
  );
}
