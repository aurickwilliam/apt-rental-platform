import { fireEvent, render, screen } from "@testing-library/react-native";

import PaymentFilterSheet from "./PaymentFilterSheet";
import DropdownButton from "@/components/buttons/DropdownButton";

const mockItems: Record<string, { className?: string; isAnimatedStyleActive?: boolean; indicatorColor?: string }> = {};
const mockSheet: { open?: boolean; portal?: Record<string, unknown>; content?: Record<string, unknown> } = {};

jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));
jest.mock("@/hooks/useTheme", () => ({ useColors: () => ({ colors: { textPrimary: "#111", primary: "#376BF5" } }) }));
jest.mock("heroui-native", () => {
  const { Pressable: P, Text: T, View: V } = jest.requireActual("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <V>{children}</V>;
  const Label = ({ children }: { children?: React.ReactNode }) => <T>{children}</T>;
  const Button = Object.assign(
    ({ children, onPress, isDisabled }: { children?: React.ReactNode; onPress?: () => void; isDisabled?: boolean }) => (
      <P accessibilityRole="button" disabled={isDisabled} onPress={onPress}>{children}</P>
    ),
    { Label },
  );
  const BottomSheet = Object.assign(
    ({ children, isOpen }: { children?: React.ReactNode; isOpen: boolean }) => {
      mockSheet.open = isOpen;
      return <V>{children}</V>;
    },
    {
      Portal: ({ children, ...props }: { children?: React.ReactNode }) => { mockSheet.portal = props; return <V>{children}</V>; },
      Overlay: () => null,
      Content: ({ children, ...props }: { children?: React.ReactNode }) => { mockSheet.content = props; return <V>{children}</V>; },
      Title: Label,
      Description: Label,
    },
  );
  const GroupContext = jest.requireActual("react").createContext(null);
  const useGroup = (): any => jest.requireActual("react").useContext(GroupContext);
  const Menu = Object.assign(Passthrough, {
    Trigger: Passthrough,
    Portal: Passthrough,
    Overlay: () => null,
    Content: ({ children, align, width }: { children?: React.ReactNode; align?: string; width?: unknown }) => (
      <V><T>{`menu align=${align} width=${String(width)}`}</T>{children}</V>
    ),
    Label,
    Group: ({ children, onSelectionChange }: { children?: React.ReactNode; onSelectionChange?: (selected: Set<string>) => void }) => (
      <GroupContext.Provider value={onSelectionChange ?? null}>{children}</GroupContext.Provider>
    ),
    Item: ({ children, id, className, isAnimatedStyleActive }: { children?: React.ReactNode; id: string; className?: string; isAnimatedStyleActive?: boolean }) => {
      const onSelect = useGroup();
      mockItems[id] = { ...mockItems[id], className, isAnimatedStyleActive };
      return <P accessibilityRole="menuitem" onPress={() => onSelect?.(new Set([id]))}>{children}</P>;
    },
    ItemIndicator: ({ iconProps }: { iconProps?: { color?: string } }) => {
      mockItems.__lastIndicator = { indicatorColor: iconProps?.color };
      return null;
    },
    ItemTitle: Label,
  });
  return { BottomSheet, Button, Menu };
});

const props = () => ({
  isOpen: true,
  onOpenChange: jest.fn(),
  yearOptions: ["All years", "2026", "2025"],
  year: "All years",
  onYearChange: jest.fn(),
  sortOptions: ["Newest", "Oldest"],
  sort: "Newest",
  onSortChange: jest.fn(),
  onReset: jest.fn(),
  isChanged: false,
});

describe("PaymentFilterSheet", () => {
  it("holds the two dropdowns, Year and Sort, showing their current values", () => {
    render(<PaymentFilterSheet {...props()} year="2026" sort="Oldest" />);
    expect(screen.getByText("Filters")).toBeTruthy();
    expect(screen.getByText("Year")).toBeTruthy();
    expect(screen.getByText("Sort")).toBeTruthy();
    expect(screen.getAllByText("2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Oldest").length).toBeGreaterThan(0);
    // Both dropdowns open as popovers lined up with their own trigger.
    expect(screen.getAllByText("menu align=start width=trigger")).toHaveLength(2);
    // The chosen year and sort carry the soft-blue highlight.
    expect(mockItems["2026"].className).toBe("bg-primary-light rounded-xl");
    expect(mockItems.Oldest.className).toBe("bg-primary-light rounded-xl");
    expect(mockItems["2025"].className).toBeUndefined();
  });

  it("opens at an explicit snap point and keeps its popovers above it", () => {
    render(<PaymentFilterSheet {...props()} />);
    expect(mockSheet.open).toBe(true);
    expect(mockSheet.content).toMatchObject({ snapPoints: ["50%"], enableDynamicSizing: false, contentContainerClassName: "h-full" });
    expect(mockSheet.portal).toMatchObject({ disableFullWindowOverlay: true });
    render(<PaymentFilterSheet {...props()} isOpen={false} />);
    expect(mockSheet.open).toBe(false);
  });

  it("keeps Done at the very bottom, below the dropdowns, clear of the home indicator", () => {
    render(<PaymentFilterSheet {...props()} />);
    const text = JSON.stringify(screen.toJSON());
    expect(text.indexOf("Done")).toBeGreaterThan(text.indexOf("Sort"));
    // The column fills the sheet and pushes Done down; it pads for the bottom inset (34 + 8).
    expect(text).toContain('"paddingBottom":42');
    expect(text.lastIndexOf("Done")).toBeGreaterThan(text.lastIndexOf("Oldest"));
  });

  it("reports a picked year and a picked sort", () => {
    const p = props();
    render(<PaymentFilterSheet {...p} />);
    fireEvent.press(screen.getByText("2025"));
    expect(p.onYearChange).toHaveBeenCalledWith("2025");
    fireEvent.press(screen.getByText("Oldest"));
    expect(p.onSortChange).toHaveBeenCalledWith("Oldest");
  });

  it("enables Reset only when something differs, and Done closes the sheet", () => {
    const unchanged = props();
    const first = render(<PaymentFilterSheet {...unchanged} />);
    fireEvent.press(screen.getByText("Reset"));
    expect(unchanged.onReset).not.toHaveBeenCalled();
    first.unmount();

    const changed = props();
    render(<PaymentFilterSheet {...changed} isChanged />);
    fireEvent.press(screen.getByText("Reset"));
    expect(changed.onReset).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText("Done"));
    expect(changed.onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("DropdownButton selected highlight", () => {
  beforeEach(() => { for (const key of Object.keys(mockItems)) delete mockItems[key]; });

  it("tints only the selected option soft blue, without the press animation that would repaint it, and colors its check", () => {
    render(<DropdownButton options={["A", "B"]} value="B" onSelect={jest.fn()} highlightSelected />);
    expect(mockItems.B).toMatchObject({ className: "bg-primary-light rounded-xl", isAnimatedStyleActive: false });
    expect(mockItems.A).toMatchObject({ className: undefined, isAnimatedStyleActive: true });
    expect(mockItems.__lastIndicator.indicatorColor).toBe("#376BF5");
  });

  it("changes nothing for existing dropdowns that do not ask for it", () => {
    render(<DropdownButton options={["A", "B"]} value="B" onSelect={jest.fn()} />);
    expect(mockItems.B).toMatchObject({ className: undefined, isAnimatedStyleActive: true });
    expect(mockItems.__lastIndicator.indicatorColor).toBeUndefined();
  });
});

describe("DropdownButton menu alignment", () => {
  it("keeps lining up with the end of its trigger unless told otherwise", () => {
    const first = render(<DropdownButton options={["A", "B"]} value="A" onSelect={jest.fn()} />);
    expect(screen.getByText("menu align=end width=200")).toBeTruthy();
    first.unmount();
    render(<DropdownButton options={["A", "B"]} value="A" onSelect={jest.fn()} align="start" width="trigger" />);
    expect(screen.getByText("menu align=start width=trigger")).toBeTruthy();
  });
});
