interface AddressInput {
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  zip_code: string;
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