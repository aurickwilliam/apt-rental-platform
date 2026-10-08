"use client";

import { useCallback, useState } from "react";

import {
  deletePassportDocument,
  requestPassportDocumentReview,
  uploadPassportDocument,
  type UploadPassportDocumentInput,
} from "@/service/passportService";

type PassportAction = "upload" | "delete" | "review";

/**
 * Passport mutations for the signed-in user. Each action rejects with a
 * user-facing message; callers decide how to show it.
 */
export function usePassportDocumentActions(userId: string) {
  const [pending, setPending] = useState<PassportAction | null>(null);

  const run = useCallback(async <T,>(action: PassportAction, task: () => Promise<T>): Promise<T> => {
    setPending(action);
    try {
      return await task();
    } finally {
      setPending(null);
    }
  }, []);

  const upload = useCallback(
    (input: Omit<UploadPassportDocumentInput, "userId">) =>
      run("upload", () => uploadPassportDocument({ ...input, userId })),
    [run, userId],
  );

  const remove = useCallback(
    (input: { id: string; storagePath: string }) =>
      run("delete", () => deletePassportDocument({ ...input, userId })),
    [run, userId],
  );

  const requestReview = useCallback(
    (id: string) => run("review", () => requestPassportDocumentReview({ id, userId })),
    [run, userId],
  );

  return { upload, remove, requestReview, pending };
}
