import { fireEvent, render, screen } from "@testing-library/react-native";

import PdfThumbnail from "./PdfThumbnail";

jest.mock("react-native-pdf", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({
      onLoadComplete,
      onError,
      renderActivityIndicator,
      source,
      singlePage,
      page,
    }: {
      onLoadComplete: () => void;
      onError: () => void;
      renderActivityIndicator: () => React.ReactElement;
      source: { uri: string };
      singlePage: boolean;
      page: number;
    }) =>
      React.createElement(View, {
        testID: "pdf-view",
        onLoadComplete,
        onError,
        renderActivityIndicator,
        source,
        singlePage,
        page,
      } as unknown as React.ComponentProps<typeof View>),
  };
});

describe("PdfThumbnail", () => {
  it("renders the first-page thumbnail when the native module is linked", () => {
    render(
      <PdfThumbnail
        uri="https://signed.test/income.pdf"
        style={{ width: 56, height: 56 }}
      />,
    );

    expect(screen.getByTestId("pdf-view")).toBeTruthy();
    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
    expect(screen.getByTestId("pdf-view").props.singlePage).toBe(true);
    expect(screen.getByTestId("pdf-view").props.page).toBe(1);
    expect(screen.getByTestId("pdf-view").props.renderActivityIndicator().props.children).toBeUndefined();
    expect(screen.queryByText("0.0%")).toBeNull();
  });

  it("reveals the page when loaded and restores the placeholder for a new URL", () => {
    const { rerender } = render(<PdfThumbnail uri="https://signed.test/a.pdf" />);

    fireEvent(screen.getByTestId("pdf-view"), "loadComplete");
    expect(screen.queryByTestId("pdf-thumbnail-placeholder")).toBeNull();

    rerender(<PdfThumbnail uri="https://signed.test/b.pdf" />);
    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
    expect(screen.getByTestId("pdf-view").props.source.uri).toBe("https://signed.test/b.pdf");
  });

  it("falls back to the file icon if rendering fails", () => {
    render(<PdfThumbnail uri="https://signed.test/a.pdf" />);

    fireEvent(screen.getByTestId("pdf-view"), "error", new Error("PDF failed"));
    expect(screen.queryByTestId("pdf-view")).toBeNull();
    expect(screen.getByTestId("pdf-thumbnail-placeholder")).toBeTruthy();
  });
});
