import { formatReviewStayLabel, formatStayRange } from "./reviewStayLabel";

describe("formatReviewStayLabel", () => {
  it("joins the apartment and the stay period", () => {
    expect(formatReviewStayLabel("Mabini Residences", "Jan 2024 - Mar 2025")).toBe(
      "Stayed at Mabini Residences · Jan 2024 - Mar 2025",
    );
  });

  it("shows whichever fact is known", () => {
    expect(formatReviewStayLabel("Mabini Residences", undefined)).toBe("Stayed at Mabini Residences");
    expect(formatReviewStayLabel(null, "6 months")).toBe("6 months");
  });

  it("is undefined when nothing is known, so no empty line renders", () => {
    expect(formatReviewStayLabel(null, undefined)).toBeUndefined();
    expect(formatReviewStayLabel("", "")).toBeUndefined();
  });
});

describe("formatStayRange", () => {
  it("formats a finished stay as short months", () => {
    expect(formatStayRange("2024-01-15T00:00:00Z", "2025-03-10T00:00:00Z")).toBe("Jan 2024 - Mar 2025");
  });

  it("says Present without an end date and handles missing dates", () => {
    expect(formatStayRange("2024-01-15T00:00:00Z", null)).toBe("Jan 2024 - Present");
    expect(formatStayRange(null, null)).toBe("Dates not available");
  });
});
