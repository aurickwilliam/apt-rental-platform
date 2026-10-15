import EmailChangeCodeScreen from "../components/EmailChangeCodeScreen";

// Step 1 of 2: the code sent to the current (still active) address.
export default function VerifyCurrentEmail() {
  return <EmailChangeCodeScreen inbox="current" />;
}
