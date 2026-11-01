import {
  getExtension,
  isImageUri,
  isPdfDocument,
  isPreviewable,
} from "./fileType";

describe("getExtension", () => {
  it("strips query params and fragments before reading the extension", () => {
    expect(getExtension("https://cdn.test/doc.jpg?token=abc")).toBe("jpg");
    expect(getExtension("https://cdn.test/doc.PDF#page=2")).toBe("pdf");
  });
});

describe("isImageUri", () => {
  it("matches image extensions and rejects document extensions", () => {
    expect(isImageUri("https://cdn.test/photo.webp")).toBe(true);
    expect(isImageUri("https://cdn.test/scan.pdf")).toBe(false);
  });
});

describe("isPdfDocument", () => {
  it("matches the stored PDF MIME type regardless of URL", () => {
    expect(
      isPdfDocument("application/pdf", "https://cdn.test/sign/object?token=abc"),
    ).toBe(true);
    expect(isPdfDocument("image/jpeg", "https://cdn.test/scan.pdf")).toBe(false);
  });

  it("falls back to the URL extension without a MIME type", () => {
    expect(isPdfDocument(null, "https://cdn.test/scan.pdf")).toBe(true);
    expect(isPdfDocument(null, "https://cdn.test/photo.jpg")).toBe(false);
  });
});
describe("isPreviewable", () => {
  it("prefers the stored MIME type over the URL", () => {
    expect(
      isPreviewable("image/jpeg", "https://cdn.test/sign/object?token=abc"),
    ).toBe(true);
    expect(
      isPreviewable("application/pdf", "https://cdn.test/photo.jpg"),
    ).toBe(false);
  });

  it("matches image MIME types case-insensitively", () => {
    expect(isPreviewable("IMAGE/PNG", "https://cdn.test/doc")).toBe(true);
  });

  it("falls back to URL sniffing without a MIME type", () => {
    expect(isPreviewable(null, "https://cdn.test/photo.jpg")).toBe(true);
    expect(isPreviewable(null, "https://cdn.test/scan.pdf")).toBe(false);
    expect(isPreviewable(undefined, "https://cdn.test/object")).toBe(true);
  });
});
