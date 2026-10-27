import { formatReviewStayLabel } from "./reviewStayLabel";

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
