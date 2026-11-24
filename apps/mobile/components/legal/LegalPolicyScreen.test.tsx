import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, type ScrollViewProps } from "react-native";
import TermsScreen from "@/app/settings/terms";
import PrivacyPolicyScreen from "@/app/settings/privacy-policy";
import { TERMS_POLICY } from "@/constants/legal/terms";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";

const mockScrollTo = jest.fn();

jest.mock("heroui-native", () => jest.requireActual("../../tests/support/heroUINativeStub"));
jest.mock("@tabler/icons-react-native", () => ({ IconArrowUp: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 6, bottom: 34, left: 0 }),
}));

jest.mock("@/components/layout/StandardHeader", () => {
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return function MockHeader({ title }: { title: string }) {
    return <Text>{title}</Text>;
  };
});

jest.mock("@/components/layout/ScreenWrapper", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { ScrollView } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: React.forwardRef(function MockScreenWrapper(
      { header, children, onScroll, bottomPadding }: { header: React.ReactNode; children: React.ReactNode; onScroll: ScrollViewProps["onScroll"]; bottomPadding: number },
      ref,
    ) {
      React.useImperativeHandle(ref, () => ({ scrollTo: mockScrollTo }));
      return <ScrollView testID="policy-scroll" onScroll={onScroll} contentContainerStyle={{ paddingBottom: bottomPadding }}>{header}{children}</ScrollView>;
    }),
  };
});

beforeEach(() => {
  mockScrollTo.mockClear();
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
});

afterEach(() => jest.restoreAllMocks());

const scrollTo = async (y: number) => await fireEvent.scroll(screen.getByTestId("policy-scroll"), { nativeEvent: { contentOffset: { x: 0, y } } });

describe.each([
  { name: "Terms", Component: TermsScreen, policy: TERMS_POLICY },
  { name: "Privacy", Component: PrivacyPolicyScreen, policy: PRIVACY_POLICY },
])("$name screen", ({ Component, policy }) => {
  it("renders all policy text, headings, metadata and callouts without a contact section", async () => {
    await render(<Component />);
    expect(screen.getByText(policy.title)).toBeTruthy();
    expect(screen.getByText(`Last updated: ${policy.lastUpdated}`)).toBeTruthy();
    expect(screen.getByText(`Version ${policy.version} · ${policy.jurisdiction}`)).toBeTruthy();

    policy.sections.forEach((section, index) => {
      expect(screen.getByRole("header", { name: `${index + 1}. ${section.title}` })).toBeTruthy();
      if (section.intro) expect(screen.getAllByText(section.intro).length).toBeGreaterThan(0);
      section.body?.forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
      section.list?.forEach((text) => expect(screen.getAllByText(`• ${text}`).length).toBeGreaterThan(0));
      section.blocks?.forEach((block) => {
        if (block.type === "list") {
          block.items.forEach((text) => expect(screen.getAllByText(`• ${text}`).length).toBeGreaterThan(0));
        } else {
          expect(screen.getAllByText(block.text).length).toBeGreaterThan(0);
        }
      });
      if (section.callout) {
        expect(screen.getAllByText(section.callout.label).length).toBeGreaterThan(0);
        expect(screen.getByText(section.callout.text)).toBeTruthy();
      }
    });

    expect(screen.queryByText("Contact APT")).toBeNull();
    expect(screen.queryByText(`Email: ${policy.contact.email}`)).toBeNull();
    expect(screen.queryByText(`Address: ${policy.contact.address}`)).toBeNull();
    expect(screen.queryByText(`Hours: ${policy.contact.hours}`)).toBeNull();
    expect(screen.queryByText(/June 2025|support@apt\.com|maximum of 12 months/)).toBeNull();
  });

  it("shows Back to top after any downward scroll, outside the scroller and clear of the safe area", async () => {
    await render(<Component />);
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
    await scrollTo(1);
    expect(screen.getByRole("button", { name: "Back to top" })).toBeTruthy();
    expect(within(screen.getByTestId("policy-scroll")).queryByRole("button", { name: "Back to top" })).toBeNull();
    expect(screen.getByTestId("policy-back-to-top").props.style).toEqual({ bottom: 50, right: 22 });
    expect(screen.getByTestId("policy-scroll").props.contentContainerStyle.paddingBottom).toBeGreaterThanOrEqual(76);
    await scrollTo(600);
    expect(screen.getByRole("button", { name: "Back to top" })).toBeTruthy();
    await scrollTo(0);
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
    await scrollTo(-10);
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
  });

  it.each([false, true])("scrolls its own ScreenWrapper to the top with reduced motion %s", async (reducedMotion) => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(reducedMotion);
    await render(<Component />);
    await scrollTo(300);
    await act(async () => await fireEvent.press(screen.getByRole("button", { name: "Back to top" })));
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 0, y: 0, animated: !reducedMotion });
  });

  it("falls back to an unanimated scroll if the motion preference cannot be read", async () => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockRejectedValue(new Error("Unavailable"));
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Component />);
    await scrollTo(200);
    await act(async () => await fireEvent.press(screen.getByRole("button", { name: "Back to top" })));
    expect(mockScrollTo).toHaveBeenCalledWith({ x: 0, y: 0, animated: false });
    expect(warning).toHaveBeenCalled();
  });

  it("does not scroll after the reader unmounts while the motion preference is pending", async () => {
    let resolvePreference!: (value: boolean) => void;
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockReturnValue(new Promise(resolve => { resolvePreference = resolve; }));
    const { unmount } = await render(<Component />);
    await scrollTo(200);
    // `await fireEvent.press` resolves with the handler's own promise, which waits on the
    // motion preference. Let the event's act scope close before unmounting the reader.
    const backPress = fireEvent.press(screen.getByRole("button", { name: "Back to top" }));
    await new Promise(resolve => setTimeout(resolve, 0));
    await unmount();
    await act(async () => resolvePreference(false));
    await backPress;
    expect(mockScrollTo).not.toHaveBeenCalled();
  });
});
