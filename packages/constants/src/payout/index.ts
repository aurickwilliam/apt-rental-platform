// Payout destination constants for landlord disbursements.
//
// BICs come from PayMongo's InstaPay receiving-institution list
// (docs.paymongo.com → List of available banks & e-wallets):
//   - G-Xchange, Inc. (GCash)        → GXCHPHM2XXX
//   - Maya Philippines, Incorporated → PAPHPHM1XXX
// Both e-wallet destinations are PH mobile numbers (09XXXXXXXXX).

export type PayoutDestinationType = 'gcash' | 'maya';

export const PAYOUT_DESTINATION_TYPES: PayoutDestinationType[] = ['gcash', 'maya'];

export const PAYOUT_DESTINATION_BICS: Record<PayoutDestinationType, string> = {
  gcash: 'GXCHPHM2XXX',
  maya: 'PAPHPHM1XXX',
};

export const PAYOUT_DESTINATION_LABELS: Record<PayoutDestinationType, string> = {
  gcash: 'GCash',
  maya: 'Maya',
};

export const PAYOUT_ACCOUNT_NUMBER_LENGTH = 11;
