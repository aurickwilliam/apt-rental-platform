import { useIsFocused } from "expo-router/react-navigation";
import { useProfile } from "@/hooks/auth";
import { useWelcomeStore } from "@/stores/useWelcomeStore";
import WelcomeDialog from "./WelcomeDialog";

export default function RentalsWelcomeGate() {
  const isFocused = useIsFocused();
  const { profile } = useProfile();
  const { pendingAuthId, dismiss } = useWelcomeStore();
  const authId = profile?.user_id;

  return (
    <WelcomeDialog
      isOpen={isFocused && !!authId && pendingAuthId === authId}
      onContinue={() => { if (authId) dismiss(authId); }}
    />
  );
}
