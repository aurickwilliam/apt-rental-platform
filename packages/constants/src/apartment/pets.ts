export const PETS = [
  'Dog',
  'Cat',
  'Bird',
  'Fish',
  'Reptile',
  'Hamster',
  'Rabbit',
  'Guinea Pig',
  'Other'
]

export const OTHER_PET = 'Other'

export const MAX_PET_COUNT = 10

/**
 * Stored preferences used to keep one kind of pet as a string; newer ones hold
 * a list. Accepts either so older saved preferences keep loading.
 */
export function normalizeKindOfPets(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((kind): kind is string => typeof kind === 'string' && kind !== '')
  }
  return typeof raw === 'string' && raw !== '' ? [raw] : []
}

/**
 * User-facing message for an invalid pet answer, or null when it is fine.
 * Fewer pets than kinds is impossible, so that is rejected too.
 */
export function getPetsError(
  hasPets: boolean,
  kindOfPets: readonly string[],
  noOfPets: number,
): string | null {
  if (!hasPets) return null
  if (kindOfPets.length === 0) return 'Please choose the kind of pets you have.'
  if (!Number.isInteger(noOfPets) || noOfPets < 1 || noOfPets > MAX_PET_COUNT) {
    return `Please enter how many pets you have (1 to ${MAX_PET_COUNT}).`
  }
  if (noOfPets < kindOfPets.length) {
    return 'The number of pets cannot be fewer than the kinds you selected.'
  }
  return null
}
