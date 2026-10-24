import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useReviewUnlock } from "@/hooks/ratings/useReviewUnlock";
import ReviewUnlockDialog from "./ReviewUnlockDialog";

interface ReviewUnlockGateProps {
  authUserId: string;
  tenantId: string;
}

/** One account-keyed gate, on Rentals only, never over a pushed route. */
export default function ReviewUnlockGate({ authUserId, tenantId }: ReviewUnlockGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useFocusEffect(useCallback(() => {
    let task: ReturnType<typeof requestIdleCallback> | undefined;
    const settle = () => {
      if (task !== undefined) cancelIdleCallback(task);
      setReady(false);
      if (AppState.currentState === "active" && pathname === "/rentals") {
        task = requestIdleCallback(() => setReady(true));
      }
    };
    settle();
    const subscription = AppState.addEventListener("change", settle);
    return () => { if (task !== undefined) cancelIdleCallback(task); subscription.remove(); setReady(false); };
  }, [pathname]));
  const { candidate, dismiss } = useReviewUnlock(authUserId, tenantId, ready && pathname === "/rentals");
  if (!candidate) return null;

  return (
    <ReviewUnlockDialog
      isOpen
      apartmentName={candidate.apartmentName}
      onDismiss={() => { dismiss(candidate); }}
      onReview={() => {
        if (dismiss(candidate)) {
          router.push({ pathname: "/apartment/[apartmentId]/ratings", params: { apartmentId: candidate.apartmentId } });
        }
      }}
    />
  );
}
