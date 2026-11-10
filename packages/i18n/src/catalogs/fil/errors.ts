import type { errors as enErrors } from "../en/errors";

export const errors: Record<keyof typeof enErrors, string> = {
  "errors.generic": "May nangyaring mali. Subukan ulit.",
  "errors.network": "I-check ang connection mo at subukan ulit.",
  "errors.unauthorized": "Wala kang access dito.",
  "errors.notFound": "Hindi namin iyon mahanap.",
};
