import { QueryClient } from "@tanstack/react-query";

import { clearPrivateMediaUrlCache } from "@/service/media/privateMediaCache";

export const CURRENT_USER_QUERY_KEY = ["current-user"] as const;
export const MOBILE_QUERY_STALE_TIME = 30_000;
export const MOBILE_QUERY_GC_TIME = 5 * 60 * 1_000;

interface RetryableReadError {
  code?: unknown;
  name?: unknown;
  status?: unknown;
}

const TRANSIENT_HTTP_STATUSES = new Set([408, 429]);
const TRANSIENT_ERROR_CODES = new Set(["ECONNABORTED", "ECONNRESET", "ENETUNREACH", "ETIMEDOUT"]);
const TRANSIENT_ERROR_NAMES = new Set(["FetchError", "NetworkError", "TimeoutError"]);

export function shouldRetryTransientRead(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1 || error instanceof TypeError || !error || typeof error !== "object") {
    return failureCount < 1 && error instanceof TypeError;
  }

  const { code, name, status } = error as RetryableReadError;

  return (
    (typeof status === "number" && (status >= 500 || TRANSIENT_HTTP_STATUSES.has(status))) ||
    (typeof code === "string" && TRANSIENT_ERROR_CODES.has(code)) ||
    (typeof name === "string" && TRANSIENT_ERROR_NAMES.has(name))
  );
}

export function createMobileQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: MOBILE_QUERY_STALE_TIME,
        gcTime: MOBILE_QUERY_GC_TIME,
        retry: shouldRetryTransientRead,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export const queryClient = createMobileQueryClient();

export function clearQueryClient(): void {
  queryClient.clear();
  clearPrivateMediaUrlCache();
}

export async function invalidateCurrentUser(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
}
