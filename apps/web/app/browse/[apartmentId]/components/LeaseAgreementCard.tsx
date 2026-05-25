"use client";

import { Button, Card } from "@heroui/react";
import { FileText } from "lucide-react";

import Link from "next/link";

interface LeaseAgreementCardProps {
  leaseDetailsUrl: string;
}

export default function LeaseAgreementCard({ leaseDetailsUrl }: LeaseAgreementCardProps) {
  const hasLease = !!leaseDetailsUrl;

  const viewerUrl = hasLease
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(leaseDetailsUrl)}&embedded=true`
    : null;

  return (
    <Card className="border border-grey-300 shadow-none">
      <Card.Content className="flex flex-col items-start gap-2">
        <h3 className="text-lg font-medium">Lease Agreement</h3>

        {viewerUrl ? (
          <>
            <p className="text-sm text-grey-500">
              View the lease agreement for this apartment.
            </p>
            <Link href={viewerUrl} target="_blank" rel="noopener noreferrer" className="w-full no-underline">
              <Button
                variant="outline"
                className="w-full"
              >
                <FileText size={16} />
                View Lease Agreement
              </Button>
            </Link>
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