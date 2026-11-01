"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Card } from "@heroui/react";
import { IconFileText } from "@tabler/icons-react";

import { createClient as createBrowserClient } from "@repo/supabase/browser";

import ProfilePhotoErrorDialog from "@/app/components/profile/ProfilePhotoErrorDialog";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface LeaseAgreementCardProps {
  leaseDetailsUrl: string;
  localFile?: File | null;
  className?: string;
}

export default function LeaseAgreementCard({ leaseDetailsUrl, localFile, className = "" }: LeaseAgreementCardProps) {
  const hasLease = !!leaseDetailsUrl || !!localFile;
  const router = useRouter();
  const { t } = useTranslation();
  const [viewingLease, setViewingLease] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const localUrl = useRef<string | null>(null);
  useEffect(() => () => {
    if (localUrl.current) URL.revokeObjectURL(localUrl.current);
    localUrl.current = null;
  }, [localFile]);

  const handleViewLease = async () => {
    if (!hasLease || viewingLease) return;
    setViewingLease(true);

    try {
      if (localFile) {
        if (localUrl.current) URL.revokeObjectURL(localUrl.current);
        const url = URL.createObjectURL(localFile);
        localUrl.current = url;
        if (localFile.name.toLowerCase().endsWith(".pdf")) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          const link = document.createElement("a");
          link.href = url;
          link.download = localFile.name;
          link.click();
        }
        return;
      }
      const supabase = createBrowserClient();
      // The lease file is private, so signed-out visitors sign in first.
      // Storage RLS still decides access; this only improves the feedback.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push("/sign-in");
        return;
      }

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
      setViewError(t("apartment.lease.errorBody"));
    } finally {
      setViewingLease(false);
    }
  };

  return (
    <Card className={`border border-border shadow-none ${className}`}>
      <Card.Content className="flex flex-col items-start gap-2">
        <h3 className="font-nunito text-lg font-semibold">{t("apartment.lease.title")}</h3>

        {hasLease ? (
          <>
            <p className="text-sm text-muted-foreground break-all">
              {localFile ? localFile.name : t("apartment.lease.description")}
            </p>
            <Button
              variant="outline"
              className="w-full"
              isDisabled={viewingLease}
              onPress={handleViewLease}
            >
              <IconFileText size={16} />
              {viewingLease ? t("apartment.lease.opening") : localFile && !localFile.name.toLowerCase().endsWith(".pdf") ? t("apartment.lease.download") : t("apartment.lease.view")}
            </Button>
          </>
        ) : (
          <p className="text-sm text-grey-500">
            {t("apartment.lease.none")}
          </p>
        )}
      </Card.Content>
      <ProfilePhotoErrorDialog
        title={t("apartment.lease.errorTitle")}
        message={viewError}
        onClose={() => setViewError(null)}
      />
    </Card>
  );
}
