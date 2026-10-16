// Listing description limit, shared by the web and mobile forms. The database
// enforces the same limit (`apartments_description_length`); keep them in sync.
export const MAX_DESCRIPTION_LENGTH = 2000;

/** The description error to show, or null when it is fine. */
export function getDescriptionError(description: string): string | null {
  if (!description.trim()) return "Apartment description is required.";
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH.toLocaleString("en-PH")} characters or fewer.`;
  }
  return null;
}
