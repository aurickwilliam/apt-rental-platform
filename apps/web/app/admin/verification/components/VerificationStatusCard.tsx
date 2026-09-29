import { Card, Chip } from "@heroui/react";
import { IconShieldCheck } from "@tabler/icons-react";
import { verificationChipColor } from "../../users/lib/user-display";
import { submittedFormatter } from "../lib/verification-display";
import { InfoField } from "../../users/[id]/components/UserDetailPrimitives";

interface VerificationStatusCardProps {
  subjectLabel: "Account" | "Apartment";
  subjectStatus: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerName: string | null;
  rejectionReason: string | null;
}

export default function VerificationStatusCard({
  subjectLabel,
  subjectStatus,
  status,
  submittedAt,
  reviewedAt,
  reviewerName,
  rejectionReason,
}: VerificationStatusCardProps) {
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
          <IconShieldCheck size={20} aria-hidden="true" />
          Verification status
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip
            size="md"
            variant="soft"
            color={
              status === "approved" ? "success" : verificationChipColor(status)
            }
            className="capitalize"
          >
            Submission: {status}
          </Chip>
          <Chip
            size="md"
            variant="soft"
            color={verificationChipColor(subjectStatus)}
            className="capitalize"
          >
            {subjectLabel}: {subjectStatus}
          </Chip>
        </div>
        <dl className="mt-4 grid gap-4">
          <InfoField
            label="Submitted"
            value={submittedFormatter.format(new Date(submittedAt))}
          />
          {reviewedAt ? (
            <InfoField
              label="Reviewed"
              value={submittedFormatter.format(new Date(reviewedAt))}
            />
          ) : null}
          {reviewerName ? (
            <InfoField label="Reviewed by" value={reviewerName} />
          ) : null}
          {rejectionReason ? (
            <InfoField label="Rejection reason" value={rejectionReason} />
          ) : null}
        </dl>
      </Card.Content>
    </Card>
  );
}
