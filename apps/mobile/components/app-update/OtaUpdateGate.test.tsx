import { fireEvent, render } from "@testing-library/react-native";
import OtaUpdateGate from "./OtaUpdateGate";

const mockRestart = jest.fn();
const mockDefer = jest.fn();
let mockState: { isReady: boolean };

jest.mock("@/hooks/appRelease/useOtaUpdate", () => ({
  useOtaUpdate: () => ({ ...mockState, restart: mockRestart, defer: mockDefer }),
}));
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  function Label({ children }: { children: React.ReactNode }) {
    return <Text>{children}</Text>;
  }
  function Button({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
    return <Pressable onPress={onPress}>{children}</Pressable>;
  }
  Button.Label = Label;
  return { Button };
});
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { secondaryForeground: "#fff" } }) }));
jest.mock("@/components/display/AppDialog", () => {
  const { Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Dialog({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
    return <View><Text>{title}</Text>{children}{footer}</View>;
  } };
});

beforeEach(() => { jest.clearAllMocks(); mockState = { isReady: true }; });

it("renders nothing until an update has been downloaded", () => {
  mockState = { isReady: false };
  expect(render(<OtaUpdateGate />).toJSON()).toBeNull();
});

it("restarts to apply the update", () => {
  const screen = render(<OtaUpdateGate />);
  expect(screen.getByText("Update ready")).toBeTruthy();
  fireEvent.press(screen.getByText("Restart now"));
  expect(mockRestart).toHaveBeenCalledTimes(1);
});

it("lets the user postpone it", () => {
  const screen = render(<OtaUpdateGate />);
  fireEvent.press(screen.getByText("Later"));
  expect(mockDefer).toHaveBeenCalledTimes(1);
});
