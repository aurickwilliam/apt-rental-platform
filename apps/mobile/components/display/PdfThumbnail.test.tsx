import { render, screen, waitFor } from "@testing-library/react-native";
import { File } from "expo-file-system";
import PdfThumbnailGenerator from "react-native-pdf-thumbnail";

import PdfThumbnail from "./PdfThumbnail";

const mockDelete = jest.fn();

jest.mock("expo-file-system", () => {
  class MockFile {
    uri: string;
    exists = true;
    delete = mockDelete;
    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((part) => (typeof part === "string" ? part : "file:///cache"))
        .join("/");
    }
    static downloadFileAsync = jest.fn();
  }
  return { File: MockFile, Paths: { cache: "file:///cache" } };
});

jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    Image: (props: { testID?: string; source: { uri: string } }) =>
      React.createElement(View, props as never),
  };
});

jest.mock("react-native-pdf-thumbnail", () => ({
  __esModule: true,
  default: { generate: jest.fn() },
}));

const download = File.downloadFileAsync as jest.Mock;
const generate = PdfThumbnailGenerator.generate as jest.Mock;

describe("PdfThumbnail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    download.mockResolvedValue("file:///cache/downloaded.pdf");
    generate.mockResolvedValue({
      uri: "file:///cache/page.jpg",
      width: 100,
      height: 140,
    });
  });

  it("keeps the file icon until the first page is rendered, then shows it", async () => {
    render(
      <PdfThumbnail
        uri="https://signed.test/income.pdf"
        style={{ width: 56, height: 56 }}
      />,
    );

    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();

    const image = await screen.findByTestId("pdf-thumbnail-image");
    expect(image.props.source.uri).toBe("file:///cache/page.jpg");
    expect(screen.queryByTestId("pdf-thumbnail-placeholder")).toBeNull();
    expect(download).toHaveBeenCalledWith(
      "https://signed.test/income.pdf",
      expect.anything(),
      { idempotent: true },
    );
    expect(generate).toHaveBeenCalledWith(
      expect.stringContaining("pdf-thumbnail-"),
      0,
      expect.objectContaining({ maxWidth: expect.any(Number) }),
    );
    // The downloaded copy is removed once the page is rendered.
    expect(mockDelete).toHaveBeenCalled();
  });

  it("restores the placeholder and renders again for a new URL", async () => {
    const { rerender } = render(<PdfThumbnail uri="https://signed.test/a.pdf" />);
    await screen.findByTestId("pdf-thumbnail-image");

    generate.mockResolvedValue({ uri: "file:///cache/b.jpg", width: 1, height: 1 });
    rerender(<PdfThumbnail uri="https://signed.test/b.pdf" />);

    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
    const image = await screen.findByTestId("pdf-thumbnail-image");
    expect(image.props.source.uri).toBe("file:///cache/b.jpg");
  });

  it("falls back to the file icon if the download or rendering fails", async () => {
    generate.mockRejectedValue(new Error("INVALID_FILE"));
    render(<PdfThumbnail uri="https://signed.test/a.pdf" />);

    await waitFor(() => expect(generate).toHaveBeenCalled());
    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(screen.queryByTestId("pdf-thumbnail-image")).toBeNull();
    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
  });

  it("degrades to the file icon when the native module is not linked", async () => {
    generate.mockImplementation(() => {
      throw new Error("The package 'react-native-pdf-thumbnail' doesn't seem to be linked.");
    });
    expect(() => render(<PdfThumbnail uri="https://signed.test/a.pdf" />)).not.toThrow();

    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
  });

  it("discards a render that finishes after the thumbnail is gone", async () => {
    let finish: (value: unknown) => void = () => undefined;
    generate.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { unmount } = render(<PdfThumbnail uri="https://signed.test/a.pdf" />);
    await waitFor(() => expect(generate).toHaveBeenCalled());

    unmount();
    mockDelete.mockClear();
    finish({ uri: "file:///cache/late.jpg", width: 1, height: 1 });

    // The late page image is removed instead of leaking into the cache.
    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
  });
});
