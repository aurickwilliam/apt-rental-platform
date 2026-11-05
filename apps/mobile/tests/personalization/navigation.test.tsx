import { fireEvent, render, waitFor } from "@testing-library/react-native";
import StepOne from "../../app/(auth)/personalization/step-one";
import StepTwo from "../../app/(auth)/personalization/step-two";
import StepThree from "../../app/(auth)/personalization/step-three";
import StepFour from "../../app/(auth)/personalization/step-four";
import StepFive from "../../app/(auth)/personalization/step-five";
import { usePersonalizationStore } from "@/stores/usePersonalizationStore";

const mockReplace = jest.fn();
const mockSave = jest.fn();
const mockToast = jest.fn();
let mockProfile: { user_id: string } | null = null;

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@repo/supabase", () => ({ supabase: { from: () => ({ update: () => ({ eq: mockSave }) }) } }));
jest.mock("hooks/auth", () => ({ useProfile: () => ({ profile: mockProfile }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { primary: "#376BF5" } }) }));
jest.mock("@tabler/icons-react-native", () => ({ IconHomeHeart: () => null }));
jest.mock("@/components/display/AppDialog", () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: function Dialog({ isOpen, onOpenChange, dismissible, title, children, footer, titleIllustration }: {
    isOpen: boolean; onOpenChange: (open: boolean) => void; dismissible: boolean;
    title: string; children: React.ReactNode; footer: React.ReactNode; titleIllustration: React.ReactNode;
  }) {
    return isOpen ? <View testID="welcome-dialog" accessibilityState={{ disabled: !dismissible }}>
      {titleIllustration}<Text>{title}</Text>{children}{footer}
      <Pressable testID="dismiss-attempt" onPress={() => onOpenChange(false)} />
    </View> : null;
  } };
});
jest.mock("components/layout/ScreenWrapper", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: View };
});
jest.mock("../../app/(auth)/personalization/components/PersonalizationProgress", () => () => null);
jest.mock("../../app/(auth)/personalization/components/CityCheckBox", () => () => null);
jest.mock("../../app/(auth)/personalization/components/PersonalizationRadioButton", () => () => null);
jest.mock("components/preferences/YesNoRadioField", () => () => null);
jest.mock("components/preferences/PetDetailsFields", () => () => null);
jest.mock("components/preferences/ParkingDetailsFields", () => () => null);
jest.mock("heroui-native", () => {
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  function Button({ children, onPress, isDisabled, className }: {
    children: React.ReactNode;
    onPress?: () => void;
    isDisabled?: boolean;
    className?: string;
  }) {
    return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!isDisabled }} disabled={isDisabled} onPress={onPress} className={className}>{children}</Pressable>;
  }
  Button.Label = Text;
  function Slider() { return null; }
  Slider.Track = () => null;
  return { Button, Slider, Separator: () => null, useToast: () => ({ toast: { show: mockToast } }) };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockProfile = null;
  mockSave.mockResolvedValue({ error: null });
  usePersonalizationStore.getState().reset();
});

it.each([
  [StepOne, "/personalization/step-two"],
  [StepTwo, "/personalization/step-three"],
  [StepThree, "/personalization/step-four"],
  [StepFour, "/personalization/step-five"],
] as const)("offers Next even with unanswered questions (%#)", (Screen, nextRoute) => {
  const screen = render(<Screen />);
  expect(screen.queryByText("Skip")).toBeNull();
  fireEvent.press(screen.getByText("Next"));
  expect(mockReplace).toHaveBeenCalledWith(nextRoute);
});

it("disables Back on the first step and gives both buttons equal width", () => {
  const screen = render(<StepOne />);
  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(2);
  expect(buttons[0].props.accessibilityState.disabled).toBe(true);
  expect(buttons.map((button) => button.props.className)).toEqual(["flex-1", "flex-1"]);
  fireEvent.press(screen.getByText("Back"));
  expect(mockReplace).not.toHaveBeenCalled();
});

it.each([
  [StepTwo, "/personalization/step-one"],
  [StepThree, "/personalization/step-two"],
  [StepFour, "/personalization/step-three"],
  [StepFive, "/personalization/step-four"],
] as const)("returns to the previous step without clearing answers (%#)", (Screen, previousRoute) => {
  const store = usePersonalizationStore.getState();
  store.toggleCity("Caloocan");
  store.setBudgetRange(10_000, 20_000);
  store.setBedroomCount("1-2 Bedrooms");
  store.setHouseholdSize("Single");
  store.setHasSmoker(true);
  const before = usePersonalizationStore.getState();
  const screen = render(<Screen />);
  fireEvent.press(screen.getByText("Back"));
  expect(mockReplace).toHaveBeenCalledWith(previousRoute);
  expect(usePersonalizationStore.getState()).toBe(before);
});

it("shows the welcome only after saving and waits for Continue before opening Rentals", async () => {
  mockProfile = { user_id: "new-account" };
  usePersonalizationStore.getState().toggleCity("Caloocan");
  const screen = render(<StepFive />);
  expect(screen.queryByText("Welcome to APT!")).toBeNull();
  fireEvent.press(screen.getByText("Let's find your place!"));
  await waitFor(() => expect(screen.getByText("Welcome to APT!")).toBeTruthy());
  expect(mockSave).toHaveBeenCalledWith("user_id", "new-account");
  expect(screen.getByText("Your account is ready. Let’s start your rental journey!")).toBeTruthy();
  expect(screen.getByTestId("welcome-dialog").props.accessibilityState.disabled).toBe(true);
  fireEvent.press(screen.getByTestId("dismiss-attempt"));
  expect(screen.getByText("Welcome to APT!")).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Continue"));
  expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(tenant)/rentals");
  expect(usePersonalizationStore.getState().selectedCities).toEqual([]);
});

it("keeps the draft and does not welcome the user when saving fails", async () => {
  mockProfile = { user_id: "new-account" };
  mockSave.mockResolvedValue({ error: { code: "TEST_FAILURE" } });
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  usePersonalizationStore.getState().toggleCity("Caloocan");
  const screen = render(<StepFive />);
  fireEvent.press(screen.getByText("Let's find your place!"));
  await waitFor(() => expect(mockToast).toHaveBeenCalled());
  expect(screen.queryByText("Welcome to APT!")).toBeNull();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(usePersonalizationStore.getState().selectedCities).toEqual(["Caloocan"]);
  log.mockRestore();
});
