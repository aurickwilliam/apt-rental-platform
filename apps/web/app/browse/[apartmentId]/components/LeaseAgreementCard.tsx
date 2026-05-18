"use client";

import { Button, Card } from "@heroui/react";
import { FileText } from "lucide-react";

import Link from "next/link";

interface LeaseAgreementCardProps {
  leaseDetailsUrl: string;
}

export default function LeaseAgreementCard({ leaseDetailsUrl }: LeaseAgreementCardProps) {
  const hasLease = !!leaseDetailsUrl;

  return (
    <Card className="border border-grey-300 shadow-none">
      <Card.Content className="flex flex-col items-start gap-2">
        <h3 className="text-lg font-medium">
          Lease Agreement
        </h3>

        {hasLease ? (
          <>
            <p className="text-sm text-grey-500">
              View the lease agreement for this apartment.
            </p>
            <Button
              className="w-full"
              isDisabled={!leaseDetailsUrl}
            >
              <FileText size={16} />

              <Link href={leaseDetailsUrl} target="_blank" rel="noopener noreferrer">
                View Lease Agreement
              </Link>
            </Button>
          </>
        ) : (
          <p className="text-sm text-grey-500">
            No lease agreement has been uploaded for this apartment.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}