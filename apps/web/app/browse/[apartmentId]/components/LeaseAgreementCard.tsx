"use client";

import { useState } from "react";

import { Button, Card } from "@heroui/react";
import { FileText } from "lucide-react";

import { createBrowserClient } from "@repo/supabase";

interface LeaseAgreementCardProps {
  leaseDetailsUrl: string;
}

export default function LeaseAgreementCard({ leaseDetailsUrl }: LeaseAgreementCardProps) {
  const hasLease = !!leaseDetailsUrl;
  const [viewingLease, setViewingLease] = useState(false);

  const handleViewLease = async () => {
    if (!leaseDetailsUrl || viewingLease) return;
    setViewingLease(true);

    try {
      const supabase = createBrowserClient();
      const { data: signed, error } = await supabase.storage
        .from("lease-agreements")
        .createSignedUrl(leaseDetailsUrl, 60 * 60);

      if (error) throw error;

      if (signed?.signedUrl) {
        const isPdf = leaseDetailsUrl.toLowerCase().endsWith(".pdf");
        const leaseUrl = isPdf
          ? signed.signedUrl
          : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
              signed.signedUrl
            )}`;

        window.open(leaseUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to view lease agreement");
    } finally {
      setViewingLease(false);
    }
  };

  return (
    <Card className="border border-grey-300 shadow-none">
      <Card.Content className="flex flex-col items-start gap-2">
        <h3 className="text-lg font-medium">Lease Agreement</h3>

        {hasLease ? (
          <>
            <p className="text-sm text-grey-500">
              View the lease agreement for this apartment.
            </p>
            <Button
              variant="outline"
              className="w-full"
              isDisabled={viewingLease}
              onPress={handleViewLease}
            >
              <FileText size={16} />
              {viewingLease ? "Opening..." : "View Lease Agreement"}
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