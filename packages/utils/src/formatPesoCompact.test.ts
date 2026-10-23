import { formatPesoCompact } from "./formatPesoCompact";

describe("formatPesoCompact", () => {
  it("leaves amounts under 1,000 as whole pesos", () => {
    expect(formatPesoCompact(0)).toBe("₱0");
    expect(formatPesoCompact(950)).toBe("₱950");
    expect(formatPesoCompact(999.4)).toBe("₱999");
  });

  it("abbreviates thousands, keeping one decimal only when needed", () => {
    expect(formatPesoCompact(1000)).toBe("₱1k");
    expect(formatPesoCompact(12500)).toBe("₱12.5k");
    expect(formatPesoCompact(16625)).toBe("₱16.6k");
    expect(formatPesoCompact(65000)).toBe("₱65k");
  });

  it("abbreviates millions and rolls 999,950+ up to the next unit", () => {
    expect(formatPesoCompact(1_200_000)).toBe("₱1.2M");
    expect(formatPesoCompact(999_950)).toBe("₱1M");
  });

  it("keeps the sign and tolerates non-finite input", () => {
    expect(formatPesoCompact(-12500)).toBe("-₱12.5k");
    expect(formatPesoCompact(Number.NaN)).toBe("₱0");
    expect(formatPesoCompact(Number.POSITIVE_INFINITY)).toBe("₱0");
  });
});
