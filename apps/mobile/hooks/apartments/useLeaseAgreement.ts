import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
import { resolvePrivateMediaUrls } from "@/service/media/privateMediaResolver";

type UseLeaseAgreementOptions = {
  onUrl?: (url: string) => void | Promise<void>;
};

export function useLeaseAgreement(options?: UseLeaseAgreementOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const { onUrl } = options ?? {};

  const openLeaseAgreement = useCallback(
    async (storagePath: string | null | undefined) => {
      if (!storagePath) {
        Alert.alert(
          "Not Found",
          "This apartment does not have a lease agreement uploaded.",
        );
        return;
      }
      setIsLoading(true);
      try {
        const { urls, error } = await resolvePrivateMediaUrls(
          "lease-agreements",
          [storagePath],
        );
        const signedUrl = urls[storagePath];
        if (error || !signedUrl) throw error ?? new Error("No signed URL");
        if (onUrl) {
          await onUrl(signedUrl);
        } else {
          await Linking.openURL(signedUrl);
        }
      } catch (err) {
        Alert.alert("Error", "Could not open lease agreement.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [onUrl],
  );

  return { openLeaseAgreement, isLoading };
}
