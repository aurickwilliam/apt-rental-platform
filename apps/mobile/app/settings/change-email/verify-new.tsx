import EmailChangeCodeScreen from "../components/EmailChangeCodeScreen";

// Step 2 of 2: the code sent to the new address; completes the change.
export default function VerifyNewEmail() {
  return <EmailChangeCodeScreen inbox="new" />;
}
