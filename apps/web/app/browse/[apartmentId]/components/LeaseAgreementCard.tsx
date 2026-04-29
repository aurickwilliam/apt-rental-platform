"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { FileText } from "lucide-react";

interface LeaseAgreementCardProps {
  leaseDetailsUrl: string;
}

export default function LeaseAgreementCard({ leaseDetailsUrl }: LeaseAgreementCardProps) {
  const hasLease = !!leaseDetailsUrl;

  return (
    <Card
      shadow="none"
      classNames={{ base: "border border-grey-300" }}
    >
      <CardBody className="flex flex-col items-start gap-2">
        <h3 className="text-lg font-medium">
          Lease Agreement
        </h3>

        {hasLease ? (
          <>
            <p className="text-sm text-grey-500">
              View the lease agreement for this apartment.
            </p>
            <Button
              as="a"
              href={leaseDetailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              color="primary"
              startContent={<FileText size={16} />}
              className="w-full"
              radius="full"
              isDisabled={!leaseDetailsUrl}
            >
              View Lease Agreement
            </Button>
          </>
        ) : (
          <p className="text-sm text-grey-500">
            No lease agreement has been uploaded for this apartment.
          </p>
        )}
      </CardBody>
    </Card>
  );
}