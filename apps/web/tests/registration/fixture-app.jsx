import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@heroui/react";
import RegistrationPolicyAcceptance from "../../app/(auth)/components/RegistrationPolicyAcceptance";
import { emptyRegistrationAcceptance } from "../../lib/registration-policies";

function PolicyForm({ title, button }) {
  const [value, setValue] = useState(emptyRegistrationAcceptance);
  return (
    <form aria-label={title} className="mx-auto my-8 max-w-lg space-y-5 rounded-xl bg-card p-6" onSubmit={event => {
      event.preventDefault();
      event.currentTarget.dataset.submissions = String(Number(event.currentTarget.dataset.submissions ?? 0) + 1);
    }}>
      <h1 className="text-xl text-foreground">{title}</h1>
      <input aria-label="Draft name" defaultValue="Unsaved draft" className="text-foreground" />
      <RegistrationPolicyAcceptance value={value} onChange={setValue} />
      <Button type="submit" isDisabled={!value.termsAccepted || !value.privacyAccepted}>{button}</Button>
    </form>
  );
}

createRoot(document.getElementById("root")).render(
  <main className="min-h-screen bg-background p-4">
    <PolicyForm title="Email registration" button="Sign Up" />
    <PolicyForm title="Google profile completion" button="Complete Profile" />
  </main>,
);
