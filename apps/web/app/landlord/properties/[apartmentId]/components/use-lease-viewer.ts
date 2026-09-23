"use client";

import { useState } from "react";
import { createClient } from "@repo/supabase/browser";

// Shared lease viewer: storage paths in DB, signed URL on read.
// PDFs open directly; office docs go through the online viewer.
export function useLeaseViewer() {
  const [viewing, setViewing] = useState(false);

  // Returns an error message on failure, null on success.
  const viewLease = async (storagePath: string | null | undefined): Promise<string | null> => {
    if (!storagePath) return null;
    setViewing(true);
    try {
      const supabase = createClient();
      const { data: signed, error: signError } = await supabase.storage
        .from("lease-agreements")
        .createSignedUrl(storagePath, 60 * 60);
      if (signError) throw signError;
      if (signed?.signedUrl) {
        const isPdf = storagePath.toLowerCase().endsWith(".pdf");
        const leaseUrl = isPdf
          ? signed.signedUrl
          : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signed.signedUrl)}`;
        window.open(leaseUrl, "_blank");
      }
      return null;
    } catch {
      return "Failed to view lease agreement.";
    } finally {
      setViewing(false);
    }
  };

  return { viewLease, viewing };
}
