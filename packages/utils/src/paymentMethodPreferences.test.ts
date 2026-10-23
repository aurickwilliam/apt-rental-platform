import {
  PAYMENT_METHOD_TYPES,
  normalizePaymentMethodPreferences,
  paymentMethodPreferencesFromRow,
  paymentMethodPreferencesToRow,
  togglePreferredPaymentMethod,
  type PaymentMethodPreference,
} from "./paymentMethodPreferences";

it("round-trips all five payment types using Web's database values", () => {
  const preferences: PaymentMethodPreference = { savedMethods: [...PAYMENT_METHOD_TYPES], defaultMethod: "Debit/Credit-Card" };
  const row = paymentMethodPreferencesToRow(preferences);
  expect(row).toEqual({ saved_methods: ["gcash", "maya", "qrph", "card", "cash"], default_method: "card" });
  expect(paymentMethodPreferencesFromRow(row)).toEqual(preferences);
});

it("handles no row, unknown methods, duplicates and a default that was not saved", () => {
  expect(paymentMethodPreferencesFromRow(null)).toEqual({ savedMethods: [], defaultMethod: null });
  expect(paymentMethodPreferencesFromRow({ saved_methods: ["gcash", "unknown", "gcash", "cash"], default_method: "card" }))
    .toEqual({ savedMethods: ["GCash", "Cash"], defaultMethod: null });
});

it("selects the first preferred type as default and repairs a removed default", () => {
  const first = togglePreferredPaymentMethod({ savedMethods: [], defaultMethod: null }, "GCash");
  expect(first).toEqual({ savedMethods: ["GCash"], defaultMethod: "GCash" });
  const second = togglePreferredPaymentMethod(first, "Maya");
  expect(second).toEqual({ savedMethods: ["GCash", "Maya"], defaultMethod: "GCash" });
  expect(togglePreferredPaymentMethod(second, "GCash")).toEqual({ savedMethods: ["Maya"], defaultMethod: "Maya" });
  expect(togglePreferredPaymentMethod(first, "GCash")).toEqual({ savedMethods: [], defaultMethod: null });
  expect(first.savedMethods).toEqual(["GCash"]);
});

it("keeps a valid default while removing a different preference", () => {
  expect(togglePreferredPaymentMethod({ savedMethods: ["Cash", "GCash"], defaultMethod: "GCash" }, "Cash"))
    .toEqual({ savedMethods: ["GCash"], defaultMethod: "GCash" });
});

it("serializes only supported method names, never extra card or wallet data", () => {
  const input = { savedMethods: ["GCash", "GCash", "Cash"], defaultMethod: "Cash", cardNumber: "DO_NOT_STORE", cvv: "DO_NOT_STORE", wallet: "DO_NOT_STORE" } as PaymentMethodPreference;
  expect(paymentMethodPreferencesToRow(input)).toEqual({ saved_methods: ["gcash", "cash"], default_method: "cash" });
  expect(normalizePaymentMethodPreferences(input)).toEqual({ savedMethods: ["GCash", "Cash"], defaultMethod: "Cash" });
});
