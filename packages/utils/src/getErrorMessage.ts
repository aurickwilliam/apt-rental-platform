/**
 * A readable message from anything thrown or returned as an error, or `fallback`.
 * Supabase returns plain objects with a `message`, not `Error` instances, and its
 * database messages are user-facing, so they are shown as-is.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}
