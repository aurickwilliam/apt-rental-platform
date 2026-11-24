/** Client-side failure copy for actions that do not have a specific reason code. */
export const errors = {
  "errors.generic": "Something went wrong. Please try again.",
  "errors.network": "Check your connection and try again.",
  "errors.unauthorized": "You do not have access to that.",
  "errors.notFound": "We could not find that.",
} as const;
