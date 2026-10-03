import { render, screen } from "@testing-library/react-native";

import PdfThumbnail from "./PdfThumbnail";

// Simulates Expo Go / a stale dev build: the native module is absent and the
// package throws on require. The thumbnail must degrade to an icon, never
// crash the screen.
jest.mock("react-native-pdf", () => {
  throw new Error(
    "react-native-blob-util: the native module is not available.",
  );
});

describe("PdfThumbnail without native modules", () => {
  it("renders a file icon instead of crashing", () => {
    expect(() =>
      render(
        <PdfThumbnail
          uri="https://signed.test/income.pdf"
          style={{ width: 56, height: 56 }}
        />,
      ),
    ).not.toThrow();
    expect(screen.queryByTestId("pdf-view")).toBeNull();
    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
  });
});
