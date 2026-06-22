interface AddressInput {
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  zip_code: string | null;
}

export function formatAddress(address: AddressInput): string {
  return [
    address.street_address,
    address.barangay,
    address.city,
    address.province,
    address.zip_code,
  ]
    .filter(Boolean)
    .join(", ");
}