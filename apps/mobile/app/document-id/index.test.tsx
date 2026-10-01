import { render, screen, waitFor } from "@testing-library/react-native";

import Index from "./index";

const mockRouter = { push: jest.fn(), replace: jest.fn() };

const mockPassportState = {
  documents: [] as unknown[],
  loading: false,
  refreshing: false,
  error: null as string | null,
  refetch: jest.fn(),
};

const mockDocumentUrlsState = {
  resolved: [] as { label: string; path: string; signedUrl: string | null }[],
  loading: false,
  error: null,
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("expo-image", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: () => View };
});

jest.mock("react-native-image-viewing", () => () => null);

jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("react-native-keyboard-aware-scroll-view", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const MockKeyboardAwareScrollView = React.forwardRef<
    React.ComponentRef<typeof RN.View>,
    { children?: React.ReactNode }
  >(function MockKeyboardAwareScrollView({ children }, ref) {
    return React.createElement(RN.View, { ref }, children);
  });
  return {
    __esModule: true,
    default: MockKeyboardAwareScrollView,
    KeyboardAwareScrollView: MockKeyboardAwareScrollView,
  };
});

jest.mock("@/hooks/useTheme", () => ({
  useColors: () => ({
    colors: {
      primary: "#376BF5",
      success: "#22C55E",
      gray400: "#9CA3AF",
      textPrimary: "#333333",
    },
    isDark: false,
  }),
}));

jest.mock("@/hooks/passport", () => ({
  usePassportDocuments: () => mockPassportState,
}));

jest.mock("@/hooks/applications", () => ({
  useDocumentUrls: () => mockDocumentUrlsState,
}));

jest.mock("heroui-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");

  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  const ButtonMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  ButtonMock.Label = Passthrough;

  const ChipMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  ChipMock.Label = Passthrough;

  const SkeletonGroupMock = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: "skeleton-group" }, children);
  const SkeletonItemMock = () =>
    React.createElement(View, { testID: "skeleton-item" });
  SkeletonGroupMock.Item = SkeletonItemMock;

  return {
    Button: ButtonMock,
    Chip: ChipMock,
    Separator: () => null,
    Spinner: () => null,
    SkeletonGroup: SkeletonGroupMock,
    Skeleton: () => null,
  };
});

jest.mock("./components/PassportSkeleton", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: "passport-skeleton" }),
  };
});

const primaryDoc = {
  id: "doc-1",
  user_id: "user-1",
  doc_type: "Driver’s License",
  storage_path: "user-1/passport/licence-1.jpg",
  storage_path_back: null,
  mime_type: "image/jpeg",
  id_type: "Driver’s License",
  verification_id: "verification-1",
  is_verified: true,
  is_primary: true,
  expires_at: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPassportState.documents = [];
  mockPassportState.loading = false;
  mockPassportState.refreshing = false;
  mockPassportState.error = null;
  mockDocumentUrlsState.resolved = [];
  mockDocumentUrlsState.loading = false;
});

describe("APT Passport wallet screen", () => {
  it("holds the skeleton while the wallet query is loading", () => {
    mockPassportState.loading = true;

    render(<Index />);

    expect(screen.getByTestId("passport-skeleton")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
  });

  it("holds the skeleton while signed URLs are still resolving", () => {
    mockDocumentUrlsState.loading = true;

    render(<Index />);

    expect(screen.getByTestId("passport-skeleton")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
  });

  it("shows the empty state once the wallet has settled empty", () => {
    render(<Index />);

    expect(screen.getByText("No documents yet")).toBeTruthy();
    expect(screen.queryByTestId("passport-skeleton")).toBeNull();
  });

  it("never renders the empty state while the wallet is still loading", async () => {
    // The wallet query links the verification ID before resolving, so a
    // settled read already contains the primary row.
    mockPassportState.loading = true;

    const { rerender } = render(<Index />);

    expect(screen.queryByText("No documents yet")).toBeNull();

    mockPassportState.loading = false;
    mockPassportState.documents = [primaryDoc];
    rerender(<Index />);

    await waitFor(() =>
      expect(screen.getByText("Valid ID / Government ID")).toBeTruthy(),
    );
    expect(screen.queryByText("No documents yet")).toBeNull();
  });

  it("keeps settled content visible on later refetches", async () => {
    const { rerender } = render(<Index />);

    await waitFor(() =>
      expect(screen.getByText("No documents yet")).toBeTruthy(),
    );

    mockPassportState.refreshing = true;
    mockPassportState.documents = [primaryDoc];
    rerender(<Index />);

    expect(screen.getByText("Valid ID / Government ID")).toBeTruthy();
    expect(screen.queryByText("No documents yet")).toBeNull();
    expect(screen.queryByTestId("passport-skeleton")).toBeNull();
  });
});

describe("PassportSkeleton", () => {
  it("renders a skeleton group matching the wallet layout", () => {
    const ActualSkeleton = jest.requireActual<
      typeof import("./components/PassportSkeleton")
    >("./components/PassportSkeleton").default;

    render(<ActualSkeleton />);

    expect(screen.getByTestId("skeleton-group")).toBeTruthy();
    expect(screen.getAllByTestId("skeleton-item").length).toBeGreaterThan(0);
  });

  it("lays the card placeholders out in two columns", () => {
    const ActualSkeleton = jest.requireActual<
      typeof import("./components/PassportSkeleton")
    >("./components/PassportSkeleton").default;
    const RNView =
      jest.requireActual<typeof import("react-native")>("react-native").View;

    const { UNSAFE_getAllByType } = render(<ActualSkeleton />);
    const wrappers = UNSAFE_getAllByType(RNView).filter(
      (node: { props?: { className?: string } }) =>
        node.props?.className === "w-[48%]",
    );

    // Four 2-column placeholders, matching the four-card grid of the real view.
    expect(wrappers.length).toBe(4);
  });
});
