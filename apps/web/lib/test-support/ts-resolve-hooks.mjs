/**
 * `node --experimental-strip-types` resolves relative imports exactly as ESM
 * requires: a full file name. Monorepo source imports are written for
 * TypeScript and bundlers, so they omit extensions and lean on directory
 * indexes (`./catalogs/en`). This test-only hook appends the candidates Node
 * needs without changing application code.
 */
const CANDIDATES = [".ts", ".tsx", "/index.ts", "/index.tsx"];

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const retryable =
      error?.code === "ERR_MODULE_NOT_FOUND" ||
      error?.code === "ERR_UNSUPPORTED_DIR_IMPORT";
    if (!retryable || !specifier.startsWith(".") || !context.parentURL?.startsWith("file:")) {
      throw error;
    }
    for (const suffix of CANDIDATES) {
      try {
        return await nextResolve(`${specifier}${suffix}`, context);
      } catch {
        // Try the next candidate.
      }
    }
    throw error;
  }
}
