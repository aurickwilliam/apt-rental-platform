"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, toast } from "@heroui/react";
import { IconStar } from "@tabler/icons-react";

import RateTenantModal from "./RateTenantModal";

interface RateTenantButtonProps {
  tenancyId: string;
  tenantName: string;
  apartmentName: string;
  myReview: { rating: number; comment: string | null } | null;
}

/** Opens the rating modal for one finished stay; relative z-10 keeps it above the card's link overlay. */
export default function RateTenantButton({ tenancyId, tenantName, apartmentName, myReview }: RateTenantButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onPress={() => setIsOpen(true)}
        className="relative z-10 mt-2 cursor-pointer rounded-full font-nunito"
      >
        <IconStar size={16} aria-hidden="true" />
        {myReview ? `Your rating: ${myReview.rating}/5 · Edit` : "Rate tenant"}
      </Button>
      <RateTenantModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tenancyId={tenancyId}
        tenantName={tenantName}
        apartmentName={apartmentName}
        initialRating={myReview?.rating}
        initialComment={myReview?.comment}
        onSaved={() => {
          toast.success(myReview ? "Rating updated" : "Rating saved");
          router.refresh();
        }}
      />
    </>
  );
}
