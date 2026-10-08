import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";

import DocumentRow from "./DocumentRow";

jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("./PdfThumbnail", () => ({
  __esModule: true,
  default: function PdfThumbnailMock() {
    return null;
  },
}));
jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({ colors: { success: "#22C55E", danger: "#EF4444", gray400: "#9CA3AF" } }),
}));
jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, View } = jest.requireActual<typeof import("react-native")>("react-native");
  function PressableFeedback({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) {
    return React.createElement(Pressable, { onPress, accessibilityRole: "button" }, children);
  }
  PressableFeedback.Highlight = function Highlight() {
    return React.createElement(View);
  };
  return { PressableFeedback };
});

const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

beforeEach(() => jest.clearAllMocks());

it("opens images in the in-app viewer", () => {
  const onPressImage = jest.fn();
  render(<DocumentRow label="Government ID" path="u/a/id.jpg" signedUrl="https://s/id.jpg" onPressImage={onPressImage} />);

  fireEvent.press(screen.getByRole("button"));
  expect(onPressImage).toHaveBeenCalledWith("https://s/id.jpg");
  expect(openURL).not.toHaveBeenCalled();
});

it("opens PDFs externally instead of the image viewer", () => {
  const onPressImage = jest.fn();
  render(<DocumentRow label="Proof of Income" path="u/passport/income.pdf" signedUrl="https://s/income.pdf" onPressImage={onPressImage} />);

  fireEvent.press(screen.getByRole("button"));
  expect(openURL).toHaveBeenCalledWith("https://s/income.pdf");
  expect(onPressImage).not.toHaveBeenCalled();
});

it("opens other files externally", () => {
  render(<DocumentRow label="Letter" path="u/letter.docx" signedUrl="https://s/letter.docx" />);

  fireEvent.press(screen.getByRole("button"));
  expect(openURL).toHaveBeenCalledWith("https://s/letter.docx");
});

it("uses only the custom handler when one is given", () => {
  const onPress = jest.fn();
  const onPressImage = jest.fn();
  render(<DocumentRow label="Doc" path="u/doc.pdf" signedUrl="https://s/doc.pdf" onPress={onPress} onPressImage={onPressImage} />);

  fireEvent.press(screen.getByRole("button"));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onPressImage).not.toHaveBeenCalled();
  expect(openURL).not.toHaveBeenCalled();
});
