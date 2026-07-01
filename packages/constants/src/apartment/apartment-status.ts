export type ApartmentStatus =
  | 'available'
  | 'occupied'
  | 'under_maintenance'
  | 'unverified'

export const VALID_APARTMENT_STATUSES: ApartmentStatus[] = [
  'available',
  'occupied',
  'under_maintenance',
  'unverified',
]

export const APARTMENT_STATUS_LABELS: Record<ApartmentStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  under_maintenance: 'Under Maintenance',
  unverified: 'Unverified',
}
