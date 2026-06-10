export function getProfileSubmitError(err: any): string {
  const msg: string = err?.message ?? "";

  if (msg.includes("No authenticated user") || msg.includes("JWT") || msg.includes("not authenticated")) {
    return "Your session has expired. Please sign in again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "No internet connection. Please check your connection and try again.";
  }
  if (msg.includes("not-null") || msg.includes("violates")) {
    return "Some required information is missing. Please fill out all fields.";
  }
  if (msg.includes("duplicate") || msg.includes("unique")) {
    return "An account with this information already exists.";
  }

  return "Something went wrong. Please try again.";
}