/* eslint-disable @typescript-eslint/no-explicit-any */

// A recording stand-in for the Supabase client's query builder: every chained
// call lands in `ops` as [method, ...args], and awaiting the builder answers
// with `answer(call)`. `FAIL` answers with an error instead of data.
export const FAIL = Symbol("fail");

export interface RecordedCall {
  table: string;
  select: string | null;
  ops: [string, ...unknown[]][];
}

interface RecorderOptions {
  answer: (call: RecordedCall) => unknown;
  rpcSections?: unknown[];
  rpcError?: Error;
}

export function createSupabaseRecorder({ answer, rpcSections = [], rpcError }: RecorderOptions) {
  const calls: RecordedCall[] = [];
  const rpcCalls: [string, unknown][] = [];

  const settle = (result: unknown) =>
    result === FAIL
      ? { data: null, error: new Error("boom") }
      : { data: result, error: null };

  const has = (call: RecordedCall, method: string, ...args: unknown[]) =>
    call.ops.some((op) => op[0] === method && JSON.stringify(op.slice(1)) === JSON.stringify(args));

  const client = {
    from(table: string) {
      const call: RecordedCall = { table, select: null, ops: [] };
      calls.push(call);
      const builder: any = new Proxy(
        {},
        {
          get(_, method: string) {
            if (method === "then") {
              return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
                Promise.resolve(settle(answer(call))).then(resolve, reject);
            }
            if (method === "select") {
              return (columns: string) => {
                call.select = columns;
                return builder;
              };
            }
            return (...args: unknown[]) => {
              call.ops.push([method, ...args]);
              return builder;
            };
          },
        },
      );
      return builder;
    },
    rpc(name: string, args: unknown) {
      rpcCalls.push([name, args]);
      const result = rpcError
        ? { data: null, error: rpcError }
        : { data: { sections: rpcSections }, error: null };
      const request: any = {
        abortSignal: () => request,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return request;
    },
  };

  return { client, calls, rpcCalls, has };
}

export const cardRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Apt ${id}`,
  barangay: "Brgy 1",
  city: "Caloocan",
  average_rating: 4.5,
  monthly_rent: 9000,
  no_bedrooms: 2,
  no_bathrooms: 1,
  area_sqm: 30,
  is_verified: true,
  apartment_images: [],
  ...overrides,
});

export const poolRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  city: "Caloocan",
  monthly_rent: 20000,
  no_bedrooms: 2,
  amenities: [] as string[],
  is_verified: true,
  average_rating: 4,
  ...overrides,
});

export const POOL_SELECT = "id, city, monthly_rent, no_bedrooms, max_occupants, amenities, is_verified, average_rating";
