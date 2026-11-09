import { Text, View } from "react-native";
import type { PaymentMethod } from "@repo/utils";

import PaymentMethodChip from "@/components/display/PaymentMethodChip";

type AcceptedPaymentMethodsProps = {
  /** Methods the landlord accepts; null or undefined while loading or when unavailable. */
  methods?: PaymentMethod[] | null;
};

// The ways this landlord accepts rent, chosen by the landlord. A tenant picks one of them at
// checkout. Names only, never account details. Left out until the list is known.
export default function AcceptedPaymentMethods({ methods }: AcceptedPaymentMethodsProps) {
  if (!methods || methods.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-foreground font-nunitoSemiBold text-base">Accepted payment methods</Text>
      <View className="flex-row flex-wrap gap-2" accessibilityLabel="Accepted payment methods">
        {methods.map((method) => (
          <PaymentMethodChip key={method} method={method} />
        ))}
      </View>
      <Text className="text-muted font-inter text-sm">
        Set by the landlord. You choose one when you pay your rent. Have a preferred method? Message the landlord first to agree on it.
      </Text>
    </View>
  );
}
