import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AppUpdateGate from "./AppUpdateGate";

const mockDismiss = jest.fn();
const mockOpen = jest.fn();
let mockState: Record<string, unknown>;
const release = { latestVersion: "1.2.0", minVersion: "1.1.0", apkUrl: "https://github.com/o/r/a.apk", releaseNotes: "Faster maps" };

jest.mock("@/hooks/appRelease/useAppUpdate", () => ({ useAppUpdate: () => mockState }));
jest.mock("@/service/appRelease/appReleaseService", () => ({ openAppDownload: (url: string) => mockOpen(url) }));
jest.mock("./AppUpdateDialog", () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Dialog({ onUpdate, onDismiss, errorMessage }: { onUpdate: () => void; onDismiss: () => void; errorMessage: string | null }) {
    return <View><Text>optional dialog</Text><Pressable onPress={onUpdate}><Text>Update</Text></Pressable><Pressable onPress={onDismiss}><Text>Maybe later</Text></Pressable>{errorMessage ? <Text>{errorMessage}</Text> : null}</View>;
  } };
});
jest.mock("./AppUpdateRequiredScreen", () => {
  const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Screen({ onUpdate }: { onUpdate: () => void }) {
    return <View><Text>required screen</Text><Pressable onPress={onUpdate}><Text>Update</Text></Pressable></View>;
  } };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOpen.mockResolvedValue(undefined);
  mockState = { release, installedVersion: "1.0.0", isRequired: false, isOffered: false, dismiss: mockDismiss };
});

it("renders nothing when there is no release or the app is current", () => {
  mockState = { ...mockState, release: null };
  expect(render(<AppUpdateGate />).toJSON()).toBeNull();
  mockState = { ...mockState, release };
  expect(render(<AppUpdateGate />).toJSON()).toBeNull();
});

it("shows the dismissible dialog for an optional update and opens the link", () => {
  mockState = { ...mockState, isOffered: true };
  const screen = render(<AppUpdateGate />);
  fireEvent.press(screen.getByText("Update"));
  expect(mockOpen).toHaveBeenCalledWith(release.apkUrl);
  fireEvent.press(screen.getByText("Maybe later"));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
});

it("shows the blocking screen, which wins over the dialog", () => {
  mockState = { ...mockState, isRequired: true, isOffered: true };
  const screen = render(<AppUpdateGate />);
  expect(screen.getByText("required screen")).toBeTruthy();
  expect(screen.queryByText("optional dialog")).toBeNull();
});

it("tells the user when the link cannot be opened", async () => {
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  mockOpen.mockRejectedValue(new Error("no browser"));
  mockState = { ...mockState, isOffered: true };
  const screen = render(<AppUpdateGate />);
  fireEvent.press(screen.getByText("Update"));
  await waitFor(() => expect(screen.getByText("The download link could not be opened. Please try again.")).toBeTruthy());
});
