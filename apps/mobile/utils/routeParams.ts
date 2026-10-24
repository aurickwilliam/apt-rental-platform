type RouteParam = string | string[] | undefined;

// Expo Router gives a repeated query param as an array; screens want one value.
export function firstParam(value: RouteParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
