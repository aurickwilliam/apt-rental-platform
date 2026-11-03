import { Card } from "@heroui/react";
import { normalizeAcceptedMethods } from "@repo/utils";

import PaymentMethodChip from "@/app/components/display/PaymentMethodChip";

interface AcceptedPaymentMethodsProps {
  /** Method names the landlord accepts, or null when the listing is not publicly readable. */
  methods: string[] | null;
}

// The ways this landlord accepts rent. Chosen by the landlord and shown to everyone, signed out
// included; a tenant picks one of them at checkout. Names only, never account details. Same card
// shell and spacing as the Lease Agreement card above it.
export default function AcceptedPaymentMethods({ methods }: AcceptedPaymentMethodsProps) {
  if (methods === null) return null;
  const accepted = normalizeAcceptedMethods(methods);

  return (
    <Card className="border border-border shadow-none">
      <Card.Content className="flex flex-col items-start gap-2">
        <h3 className="font-nunito text-lg font-semibold">Accepted payment methods</h3>
        <ul className="flex flex-wrap gap-2" aria-label="Accepted payment methods">
          {accepted.map((method) => (
            <li key={method}>
              <PaymentMethodChip method={method} />
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Set by the landlord. You choose one when you pay your rent. Have a preferred method? Message the landlord first to agree on it.
        </p>
      </Card.Content>
    </Card>
  );
}
